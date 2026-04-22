import os
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app
from core.dataset_loader import load_csv, detect_column_types
from core.bias_analyzer import run_full_analysis
from core.sample_data import generate_hiring_demo

upload_bp = Blueprint('upload', __name__)


@upload_bp.route('/upload')
def upload_page():
    return render_template('upload.html')


@upload_bp.route('/analyze', methods=['POST'])
def analyze():
    try:
        use_demo = request.form.get('use_demo', 'false').lower() == 'true'

        if use_demo:
            filepath = generate_hiring_demo()
            target_col = 'hired'
            sensitive_col = 'gender'
            dataset_name = 'hiring_bias_demo.csv'
        else:
            # Handle file upload
            if 'dataset' not in request.files:
                flash('No file was uploaded. Please select a CSV file.', 'error')
                return redirect(url_for('upload.upload_page'))

            file = request.files['dataset']
            if file.filename == '':
                flash('No file selected. Please choose a CSV file.', 'error')
                return redirect(url_for('upload.upload_page'))

            if not file.filename.lower().endswith('.csv'):
                flash('Invalid file type. Please upload a CSV file.', 'error')
                return redirect(url_for('upload.upload_page'))

            # Save uploaded file
            upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            filepath = os.path.join(upload_folder, file.filename)
            file.save(filepath)

            target_col = request.form.get('target_col', '')
            sensitive_col = request.form.get('sensitive_col', '')
            dataset_name = file.filename

            if not target_col or not sensitive_col:
                flash('Please select both a target column and a sensitive attribute.', 'error')
                return redirect(url_for('upload.upload_page'))

        # Load and analyze
        df, columns, shape = load_csv(filepath)

        if target_col not in columns:
            flash(f'Target column "{target_col}" not found in dataset.', 'error')
            return redirect(url_for('upload.upload_page'))

        if sensitive_col not in columns:
            flash(f'Sensitive attribute "{sensitive_col}" not found in dataset.', 'error')
            return redirect(url_for('upload.upload_page'))

        analysis = run_full_analysis(df, target_col, sensitive_col)
        analysis['dataset_name'] = dataset_name

        # Store in session
        session['analysis'] = analysis

        return redirect(url_for('report.report_page'))

    except ValueError as e:
        flash(f'Data error: {str(e)}', 'error')
        return redirect(url_for('upload.upload_page'))
    except Exception as e:
        flash(f'An unexpected error occurred: {str(e)}', 'error')
        return redirect(url_for('upload.upload_page'))
