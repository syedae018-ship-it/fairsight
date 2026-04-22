from flask import Blueprint, render_template, request, session, redirect, url_for, flash, current_app, jsonify
from core.model_analyzer import run_model_bias_analysis
import os
import pandas as pd

model_bp = Blueprint('model', __name__)

@model_bp.route('/model-upload')
def model_upload():
    return render_template('model_upload.html')

@model_bp.route('/csv-columns', methods=['POST'])
def csv_columns():
    """Parse uploaded CSV and return column names for the sensitive attribute dropdown."""
    csv_file = request.files.get('csv_file')
    if not csv_file:
        return jsonify({'error': 'No CSV file provided'}), 400
    try:
        df = pd.read_csv(csv_file)
        columns = df.columns.tolist()
        return jsonify({'columns': columns})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@model_bp.route('/analyze-model', methods=['POST'])
def analyze_model():
    use_demo = request.form.get('use_demo')
    sensitive_col = request.form.get('sensitive_col', 'gender')

    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)

    try:
        if use_demo:
            model_path = os.path.join('demo', 'biased_model.pkl')
            csv_path = os.path.join('demo', 'test_data.csv')
            sensitive_col = 'gender'
        else:
            model_file = request.files.get('model_file')
            csv_file = request.files.get('csv_file')

            if not model_file or not csv_file:
                flash('Please upload both a .pkl model and a test CSV.', 'error')
                return redirect(url_for('model.model_upload'))

            model_path = os.path.join(upload_folder, 'uploaded_model.pkl')
            csv_path = os.path.join(upload_folder, 'uploaded_test.csv')
            model_file.save(model_path)
            csv_file.save(csv_path)

        analysis = run_model_bias_analysis(model_path, csv_path, sensitive_col)
        session['analysis'] = analysis
        return redirect(url_for('report.report_page'))

    except Exception as e:
        flash(f'Error analyzing model: {str(e)}', 'error')
        return redirect(url_for('model.model_upload'))
