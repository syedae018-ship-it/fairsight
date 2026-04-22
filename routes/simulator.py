from flask import Blueprint, render_template, session, request, jsonify

simulator_bp = Blueprint('simulator', __name__)

@simulator_bp.route('/simulator')
def simulator_page():
    analysis = session.get('analysis')
    return render_template('simulator.html', analysis=analysis)

@simulator_bp.route('/simulator/recalculate', methods=['POST'])
def recalculate():
    """
    Recalculates fairness score and DI based on simulated demographic parity rates.
    Expects JSON: { "demographic_parity": { "Male": 0.6, "Female": 0.4 } }
    """
    data = request.get_json()
    parity = data.get('demographic_parity', {})
    
    rates = list(parity.values())
    if not rates:
        return jsonify({"error": "No rates provided"}), 400
        
    max_rate = max(rates)
    min_rate = min(rates)
    
    # Calculate DI
    di = round(min_rate / max_rate, 4) if max_rate > 0 else 1.0
    
    # Simple score calculation mock for the simulator
    if di <= 0.0:
        base_score = 0.0
    elif di < 0.6:
        base_score = (di / 0.6) * 30.0
    elif di < 0.8:
        base_score = 30.0 + ((di - 0.6) / 0.2) * 20.0
    elif di <= 1.0:
        base_score = 75.0 + ((di - 0.8) / 0.2) * 25.0
    elif di <= 1.2:
        base_score = 100.0 - ((di - 1.0) / 0.2) * 25.0
    elif di <= 2.0:
        base_score = 60.0 - ((di - 1.2) / 0.8) * 20.0
    else:
        base_score = 40.0
        
    score = int(max(0, min(100, base_score)))
    
    if score < 50: verdict = 'biased'
    elif score < 75: verdict = 'warning'
    else: verdict = 'fair'
    
    return jsonify({
        "fairness_score": score,
        "disparate_impact": di,
        "verdict": verdict
    })
