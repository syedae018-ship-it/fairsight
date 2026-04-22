from flask import Blueprint, render_template, session

timeline_bp = Blueprint('timeline', __name__)

@timeline_bp.route('/timeline')
def timeline_page():
    # In a real app, this would query a database. 
    # For this demo, we'll construct a mock history and append the current session analysis.
    history = [
        {"date": "2023-10-01", "score": 42, "di": 0.65, "dataset": "Q3_Hiring_Data_v1.csv"},
        {"date": "2023-11-15", "score": 58, "di": 0.76, "dataset": "Q4_Hiring_Data_Initial.csv"},
        {"date": "2024-01-20", "score": 71, "di": 0.82, "dataset": "Q1_Hiring_Data_SMOTE.csv"}
    ]
    
    current = session.get('analysis')
    if current:
        history.append({
            "date": current.get('analysis_timestamp', 'Just now').split(' ')[0],
            "score": current.get('fairness_score', 0),
            "di": current.get('disparate_impact', 0),
            "dataset": current.get('dataset_name', 'Current Dataset')
        })
        
    return render_template('timeline.html', history=history)
