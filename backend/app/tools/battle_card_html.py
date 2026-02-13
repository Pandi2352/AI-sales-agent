import os
import datetime
from app.config import settings


def generate_battle_card_html(
    competitor_name: str,
    your_product_name: str,
    quick_stats: str,
    positioning_summary: str,
    feature_comparison: str,
    their_strengths: str,
    their_weaknesses: str,
    objections_and_responses: str,
    killer_questions: str,
    landmines: str,
) -> dict:
    """Generate a professional HTML battle card for sales reps.

    Args:
        competitor_name: Name of the competitor company.
        your_product_name: Name of your product.
        quick_stats: One-liner facts about the competitor.
        positioning_summary: How to position against them.
        feature_comparison: Key features comparison (us vs. them).
        their_strengths: Honest assessment of their strengths.
        their_weaknesses: Where we beat them.
        objections_and_responses: Top objections with scripted responses.
        killer_questions: Questions to ask prospects.
        landmines: Traps to set in competitive deals.

    Returns:
        dict with status, file_path, and html content.
    """
    generated_date = datetime.datetime.now().strftime("%B %d, %Y")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Battle Card: {your_product_name} vs {competitor_name}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }}
  .container {{ max-width: 1000px; margin: 0 auto; padding: 32px 24px; }}

  /* Header */
  .header {{ background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); color: white; padding: 40px; border-radius: 16px; margin-bottom: 24px; }}
  .header h1 {{ font-size: 28px; font-weight: 700; margin-bottom: 4px; }}
  .header .subtitle {{ font-size: 16px; opacity: 0.8; }}
  .header .meta {{ margin-top: 16px; font-size: 13px; opacity: 0.6; }}
  .badge {{ display: inline-block; background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4); color: #93c5fd; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }}

  /* Cards */
  .card {{ background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; margin-bottom: 20px; }}
  .card h2 {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }}
  .card h3 {{ font-size: 15px; font-weight: 600; color: #334155; margin: 16px 0 8px; }}

  /* Sections */
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
  .strength {{ border-left: 4px solid #ef4444; padding-left: 16px; margin-bottom: 12px; }}
  .weakness {{ border-left: 4px solid #22c55e; padding-left: 16px; margin-bottom: 12px; }}
  .objection {{ background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 12px; }}
  .objection .q {{ font-weight: 600; color: #dc2626; margin-bottom: 6px; }}
  .objection .a {{ color: #166534; }}
  .killer {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 8px; border-radius: 0 8px 8px 0; }}
  .landmine {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin-bottom: 8px; border-radius: 0 8px 8px 0; }}

  .tag {{ display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-right: 4px; }}
  .tag-red {{ background: #fef2f2; color: #dc2626; }}
  .tag-green {{ background: #f0fdf4; color: #16a34a; }}

  pre {{ white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }}

  @media print {{
    body {{ background: white; }}
    .container {{ padding: 0; }}
    .card {{ break-inside: avoid; }}
  }}
</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="badge">COMPETITIVE BATTLE CARD</div>
    <h1>{your_product_name} vs {competitor_name}</h1>
    <div class="subtitle">Competitive Intelligence for Sales Teams</div>
    <div class="meta">Generated on {generated_date} &bull; Confidential - Internal Use Only</div>
  </div>

  <!-- Quick Stats -->
  <div class="card">
    <h2>Quick Stats</h2>
    <pre>{quick_stats}</pre>
  </div>

  <!-- Positioning -->
  <div class="card">
    <h2>Positioning Summary</h2>
    <pre>{positioning_summary}</pre>
  </div>

  <!-- Feature Comparison -->
  <div class="card">
    <h2>Feature Comparison</h2>
    <pre>{feature_comparison}</pre>
  </div>

  <!-- Strengths & Weaknesses -->
  <div class="grid-2">
    <div class="card">
      <h2><span class="tag tag-red">CAUTION</span> Their Strengths</h2>
      <div class="strength"><pre>{their_strengths}</pre></div>
    </div>
    <div class="card">
      <h2><span class="tag tag-green">ADVANTAGE</span> Their Weaknesses</h2>
      <div class="weakness"><pre>{their_weaknesses}</pre></div>
    </div>
  </div>

  <!-- Objection Handling -->
  <div class="card">
    <h2>Objection Handling Scripts</h2>
    <pre>{objections_and_responses}</pre>
  </div>

  <!-- Killer Questions -->
  <div class="card">
    <h2>Killer Questions</h2>
    <div class="killer"><pre>{killer_questions}</pre></div>
  </div>

  <!-- Landmines -->
  <div class="card">
    <h2>Competitive Landmines</h2>
    <div class="landmine"><pre>{landmines}</pre></div>
  </div>

</div>
</body>
</html>"""

    # Save to file
    os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
    safe_name = competitor_name.lower().replace(" ", "_").replace(".", "")
    file_path = os.path.join(settings.OUTPUT_DIR, f"battle_card_{safe_name}.html")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html)

    return {
        "status": "success",
        "file_path": file_path,
        "message": f"Battle card saved to {file_path}",
        "html": html,
    }
