"""chat_sessions_and_profile_extensions

Revision ID: d4e5f6a7b8c9
Revises: c2c779c35412
Create Date: 2026-10-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e5f6a7b8c9'
down_revision = 'c2c779c35412'
branch_labels = None
depends_on = None


def upgrade():
    # 1. validation_sessions
    try:
        op.create_table(
            'validation_sessions',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('idea_id', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(length=255), server_default='New Startup Idea', nullable=False),
            sa.Column('status', sa.String(length=30), server_default='active', nullable=False),
            sa.Column('extracted_context', sa.JSON(), nullable=False),
            sa.Column('completeness_score', sa.Float(), server_default='0.0', nullable=False),
            sa.Column('is_deleted', sa.Boolean(), server_default='0', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['idea_id'], ['ideas.id'], ondelete='SET NULL'),
        )
        op.create_index('ix_validation_sessions_user_id', 'validation_sessions', ['user_id'])
        op.create_index('ix_validation_sessions_idea_id', 'validation_sessions', ['idea_id'])
    except Exception:
        pass

    # 2. conversation_messages
    try:
        op.create_table(
            'conversation_messages',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('session_id', sa.String(length=64), nullable=False),
            sa.Column('role', sa.String(length=20), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('metadata_json', sa.JSON(), nullable=True),
            sa.Column('client_message_id', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['session_id'], ['validation_sessions.id'], ondelete='CASCADE'),
            sa.UniqueConstraint('session_id', 'client_message_id', name='uq_session_client_message_id')
        )
        op.create_index('ix_conversation_messages_session_id', 'conversation_messages', ['session_id'])
        op.create_index('ix_conversation_messages_created_at', 'conversation_messages', ['created_at'])
    except Exception:
        pass

    # 3. user_profiles
    try:
        op.create_table(
            'user_profiles',
            sa.Column('user_id', sa.Integer(), primary_key=True),
            sa.Column('college', sa.String(length=255), nullable=True),
            sa.Column('course', sa.String(length=255), nullable=True),
            sa.Column('graduation_year', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        )
    except Exception:
        pass

    # 4. user_preferences
    try:
        op.create_table(
            'user_preferences',
            sa.Column('user_id', sa.Integer(), primary_key=True),
            sa.Column('theme', sa.String(length=20), server_default='light', nullable=False),
            sa.Column('email_notifications', sa.Boolean(), server_default='1', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        )
    except Exception:
        pass

    # 5. users table extensions
    with op.batch_alter_table('users') as batch_op:
        for col_name, col_type, default in [
            ('auth_provider', sa.String(length=20), 'LOCAL'),
            ('google_sub', sa.String(length=100), None),
            ('profile_image', sa.String(length=500), None),
            ('last_login_at', sa.DateTime(), None),
        ]:
            try:
                batch_op.add_column(sa.Column(col_name, col_type, server_default=default, nullable=True if col_name != 'auth_provider' else False))
            except Exception:
                pass
        try:
            batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=True)
        except Exception:
            pass
        try:
            batch_op.create_index('ix_users_google_sub', ['google_sub'], unique=True)
        except Exception:
            pass

    # 6. validation_results extensions
    with op.batch_alter_table('validation_results') as batch_op:
        for col_name, col_type, default in [
            ('session_id', sa.String(length=64), None),
            ('framework_version', sa.String(length=20), 'v1.0'),
            ('generation_mode', sa.String(length=30), 'ai_standard'),
            ('degraded', sa.Boolean(), '0'),
            ('inputs_changed', sa.JSON(), None),
            ('summary', sa.Text(), None),
            ('strategic_verdict', sa.Text(), None),
            ('recommended_action', sa.Text(), None),
            ('analysis_json', sa.JSON(), None),
        ]:
            try:
                batch_op.add_column(sa.Column(col_name, col_type, server_default=default, nullable=True if col_name not in ['framework_version', 'generation_mode', 'degraded'] else False))
            except Exception:
                pass


def downgrade():
    with op.batch_alter_table('validation_results') as batch_op:
        for col_name in ['session_id', 'framework_version', 'generation_mode', 'degraded', 'inputs_changed', 'summary', 'strategic_verdict', 'recommended_action', 'analysis_json']:
            try:
                batch_op.drop_column(col_name)
            except Exception:
                pass

    with op.batch_alter_table('users') as batch_op:
        for col_name in ['auth_provider', 'google_sub', 'profile_image', 'last_login_at']:
            try:
                batch_op.drop_column(col_name)
            except Exception:
                pass

    for table in ['user_preferences', 'user_profiles', 'conversation_messages', 'validation_sessions']:
        try:
            op.drop_table(table)
        except Exception:
            pass
