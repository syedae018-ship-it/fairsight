from flask import Blueprint, render_template, session

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
def index():
    analysis = session.get('analysis')
    stats = {
        'datasets_analyzed': 1247,
        'bias_cases_flagged': 389,
        'models_audited': 94
    }
    
    # Generate a simple fallback summary if analysis exists
    summary = "Upload a dataset to begin your fairness audit."
    if analysis:
        score = analysis.get('fairness_score', 0)
        verdict = analysis.get('verdict', 'unknown')
        if score < 50:
            summary = "Critical bias detected. Immediate remediation is required."
        elif score < 75:
            summary = "Moderate bias found. Please review the detailed report."
        else:
            summary = "Dataset appears fair. No significant bias detected."
            
    return render_template('dashboard.html', stats=stats, analysis=analysis, summary=summary)
