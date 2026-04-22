from flask import Blueprint, render_template, session, redirect, url_for, flash, jsonify, request
from core.fix_suggester import get_ai_suggestions

suggestions_bp = Blueprint('suggestions', __name__)


@suggestions_bp.route('/suggestions')
def suggestions_page():
    analysis = session.get('analysis')
    if not analysis:
        flash('No analysis data found. Please upload a dataset first.', 'error')
        return redirect(url_for('upload.upload_page'))
    # Suggestions are fetched client-side via POST /regenerate on DOMContentLoaded
    return render_template('suggestions.html', analysis=analysis, suggestions=[])


@suggestions_bp.route('/regenerate', methods=['POST'])
def regenerate():
    analysis = session.get('analysis')
    if not analysis:
        return jsonify({'error': 'No analysis data found. Please run an analysis first.'}), 400
    try:
        suggestions = get_ai_suggestions(analysis)
        # Cache in session so download works even after navigation
        session['suggestions'] = suggestions
        return jsonify({'suggestions': suggestions})
    except ValueError as e:
        return jsonify({'error': str(e)}), 422
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500