from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# Demo users (mock authentication)
DEMO_USERS = {
    'admin@fairsight.ai': 'admin123',
    'demo@fairsight.ai': 'demo123',
    'test@test.com': 'test123'
}


def login_required(f):
    """Decorator to protect routes — redirects to login if not authenticated."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('authenticated'):
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # If already logged in, redirect to dashboard
    if session.get('authenticated'):
        return redirect(url_for('dashboard.index'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        # Validate
        if not email or '@' not in email:
            flash('Please enter a valid email address.', 'error')
            return render_template('login.html')

        if not password:
            flash('Password is required.', 'error')
            return render_template('login.html')

        # Authenticate against demo users
        if email in DEMO_USERS and DEMO_USERS[email] == password:
            session['authenticated'] = True
            session['user_email'] = email
            session['user_name'] = email.split('@')[0].title()
            flash(f'Welcome back, {session["user_name"]}!', 'success')
            return redirect(url_for('dashboard.index'))
        else:
            flash('Invalid email or password.', 'error')
            return render_template('login.html')

    return render_template('login.html')


@auth_bp.route('/guest')
def guest_login():
    """Continue as guest — sets auth but marks as guest."""
    session['authenticated'] = True
    session['user_email'] = 'guest'
    session['user_name'] = 'Guest'
    session['is_guest'] = True
    return redirect(url_for('dashboard.index'))


@auth_bp.route('/logout')
def logout():
    session.pop('authenticated', None)
    session.pop('user_email', None)
    session.pop('user_name', None)
    session.pop('is_guest', None)
    flash('You have been logged out.', 'success')
    return redirect(url_for('auth.login'))
