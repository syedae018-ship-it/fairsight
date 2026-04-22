from flask import Blueprint, render_template, session, redirect, url_for, flash

report_bp = Blueprint('report', __name__)


@report_bp.route('/report')
def report_page():
    analysis = session.get('analysis')
    if not analysis:
        flash('No analysis data found. Please upload a dataset first.', 'error')
        return redirect(url_for('upload.upload_page'))

    return render_template('report.html', analysis=analysis)
