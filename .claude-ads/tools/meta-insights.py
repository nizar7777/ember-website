#!/usr/bin/env python3
"""Read Meta ad performance for the Ember account. READ ONLY.

This script can only read. It issues GET requests and nothing else — there
is no code path in here that creates, edits, pauses or spends. If the token
you give it happens to carry write scopes, this script still will not use
them.

THE TOKEN
    Never passed as an argument, never written to a file, never printed.
    It is read from the META_ACCESS_TOKEN environment variable and used
    only as a request parameter. Passing it as a command-line argument
    would put it in your shell history, which is why there is no flag for
    it.

USAGE
    python meta-insights.py
    python meta-insights.py --days 7
    python meta-insights.py --csv out.csv     # feed the ingest adapter

    If the API rejects the version, bump it:
    python meta-insights.py --api-version v24.0

WHY THE VERSION IS A FLAG
    Meta retires Graph API versions on a rolling schedule and the default
    below will go stale. If you see an "unsupported version" error, that is
    what happened — raise the number, it is not a broken token.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

AD_ACCOUNT_ID = "act_2104778956966880"
DEFAULT_API_VERSION = "v23.0"
GRAPH_HOST = "https://graph.facebook.com"


class MetaReadError(RuntimeError):
    """Raised when the Graph API cannot be read cleanly."""


def _token() -> str:
    token = os.environ.get("META_ACCESS_TOKEN", "").strip()
    if not token:
        raise MetaReadError(
            "META_ACCESS_TOKEN is not set.\n"
            "Set it as a Windows user environment variable, then open a new\n"
            "terminal. Do not paste the token into a command - that puts it\n"
            "in your shell history."
        )
    return token


def _get(path: str, params: dict[str, str], version: str) -> dict:
    """One GET against the Graph API. The only verb this script uses."""
    query = dict(params)
    query["access_token"] = _token()
    url = f"{GRAPH_HOST}/{version}/{path}?{urllib.parse.urlencode(query)}"

    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        # Surface Meta's own message, but never echo the URL — it carries
        # the token.
        try:
            message = json.loads(body)["error"]["message"]
        except (ValueError, KeyError):
            message = body[:400]
        raise MetaReadError(f"Graph API returned {exc.code}: {message}") from None
    except urllib.error.URLError as exc:
        raise MetaReadError(f"Could not reach the Graph API: {exc.reason}") from None


def fetch_campaigns(version: str) -> dict[str, dict]:
    payload = _get(
        f"{AD_ACCOUNT_ID}/campaigns",
        {"fields": "id,name,status,effective_status,daily_budget,lifetime_budget", "limit": "100"},
        version,
    )
    return {row["id"]: row for row in payload.get("data", [])}


def fetch_insights(version: str, days: int) -> list[dict]:
    payload = _get(
        f"{AD_ACCOUNT_ID}/insights",
        {
            "level": "ad",
            "time_increment": "1",
            "date_preset": "maximum" if days <= 0 else f"last_{days}d",
            "fields": ",".join([
                "date_start", "date_stop", "account_id", "account_name",
                "campaign_id", "campaign_name", "ad_id", "ad_name",
                "spend", "impressions", "reach", "frequency", "clicks", "ctr",
                "actions", "cost_per_action_type",
            ]),
            "limit": "500",
        },
        version,
    )
    return payload.get("data", [])


def summarise(rows: list[dict], campaigns: dict[str, dict]) -> None:
    if not rows:
        print("No delivery data returned.")
        print("Either the campaign has not started spending yet, or it was")
        print("never published. Check its status in Ads Manager.")
        return

    total_spend = sum(float(r.get("spend", 0) or 0) for r in rows)
    total_impressions = sum(int(r.get("impressions", 0) or 0) for r in rows)
    total_clicks = sum(int(r.get("clicks", 0) or 0) for r in rows)

    # Action types are not guessed. Whatever Meta reports is what is shown,
    # because the messaging-conversation action key has changed name more
    # than once and hardcoding one silently reports zero when it moves.
    action_totals: dict[str, float] = {}
    for row in rows:
        for action in row.get("actions", []) or []:
            key = action.get("action_type", "unknown")
            action_totals[key] = action_totals.get(key, 0.0) + float(action.get("value", 0) or 0)

    window = f"{rows[0].get('date_start')} to {rows[-1].get('date_stop')}"
    print(f"Window:      {window}")
    print(f"Spend:       {total_spend:.2f} (account currency)")
    print(f"Impressions: {total_impressions:,}")
    print(f"Clicks:      {total_clicks:,}")
    if total_impressions:
        print(f"CTR:         {(total_clicks / total_impressions * 100):.2f}%")

    print("\nCampaign status")
    seen = {r.get("campaign_id") for r in rows}
    for campaign_id in seen:
        meta = campaigns.get(campaign_id, {})
        print(f"  {meta.get('name', campaign_id)}: {meta.get('effective_status', 'unknown')}")

    print("\nActions reported by Meta")
    if not action_totals:
        print("  none yet")
    for key, value in sorted(action_totals.items(), key=lambda kv: -kv[1]):
        cost = total_spend / value if value else 0
        print(f"  {key}: {value:.0f}  (cost each: {cost:.2f})")


def write_csv(rows: list[dict], campaigns: dict[str, dict], path: str) -> None:
    """Emit the portable format the claude_ads_core ingest adapter accepts."""
    columns = [
        "date", "account_id", "account_name", "campaign_id", "campaign_name",
        "campaign_status", "creative_id", "creative_name", "conversion_action",
        "conversions", "budget", "spend", "currency",
    ]
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            campaign = campaigns.get(row.get("campaign_id", ""), {})
            budget = campaign.get("lifetime_budget") or campaign.get("daily_budget") or "0"
            # Meta returns budgets in minor units (cents).
            budget_major = float(budget) / 100 if str(budget).isdigit() else 0.0

            actions = row.get("actions", []) or []
            top = max(actions, key=lambda a: float(a.get("value", 0) or 0), default=None)

            writer.writerow({
                "date": row.get("date_start", ""),
                "account_id": row.get("account_id", ""),
                "account_name": row.get("account_name", "") or "Ember",
                "campaign_id": row.get("campaign_id", ""),
                "campaign_name": row.get("campaign_name", ""),
                "campaign_status": campaign.get("effective_status", "UNKNOWN"),
                "creative_id": row.get("ad_id", ""),
                "creative_name": row.get("ad_name", ""),
                "conversion_action": top.get("action_type") if top else "none",
                "conversions": top.get("value") if top else "0",
                "budget": f"{budget_major:.2f}",
                "spend": row.get("spend", "0"),
                "currency": "USD",
            })
    print(f"\nWrote {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Read Meta ad performance. Read only.")
    parser.add_argument("--days", type=int, default=0, help="lookback window; 0 means all time")
    parser.add_argument("--api-version", default=DEFAULT_API_VERSION)
    parser.add_argument("--csv", help="also write the ingest-format CSV here")
    args = parser.parse_args()

    try:
        campaigns = fetch_campaigns(args.api_version)
        rows = fetch_insights(args.api_version, args.days)
    except MetaReadError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    summarise(rows, campaigns)
    if args.csv and rows:
        write_csv(rows, campaigns, args.csv)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
