"""phase1_versioning_feedback

Revision ID: c1d2e3f4a5b6
Revises: b4d5e6a7b8c9
Create Date: 2026-10-13 06:00:00.000000

Adds:
  - validation_results.rules_version  (VARCHAR 50)
  - validation_results.category       (VARCHAR 50)
  - validation_results.sample_spread  (JSON / TEXT)
  - user_feedback table               (id, result_id, user_id, direction, reason, created_at)
"""
from alembic import op
import sqlalchemy as sa

revision = 'c1d2e3f4a5b6'
down_revision = 'b4d5e6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)
    vr_cols = [c['name'] for c in insp.get_columns('validation_results')]

    # ── validation_results new columns ────────────────────────────────
    with op.batch_alter_table('validation_results') as batch_op:
        if 'rules_version' not in vr_cols:
            batch_op.add_column(
                sa.Column('rules_version', sa.String(length=50), nullable=True, server_default='v1')
            )
        if 'category' not in vr_cols:
            batch_op.add_column(
                sa.Column('category', sa.String(length=50), nullable=True)
            )
        if 'sample_spread' not in vr_cols:
            batch_op.add_column(
                sa.Column('sample_spread', sa.JSON(), nullable=True)
            )

    # ── user_feedback table ────────────────────────────────────────────
    bind = op.get_bind()
    insp = sa.inspect(bind)
    table_names = insp.get_table_names()
    if 'user_feedback' not in table_names:
        op.create_table(
            'user_feedback',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('result_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('direction', sa.String(length=20), nullable=False),
            sa.Column('reason', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['result_id'], ['validation_results.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_user_feedback_result_id', 'user_feedback', ['result_id'])
        op.create_index('ix_user_feedback_user_id', 'user_feedback', ['user_id'])


def downgrade():
    op.drop_index('ix_user_feedback_user_id', table_name='user_feedback')
    op.drop_index('ix_user_feedback_result_id', table_name='user_feedback')
    op.drop_table('user_feedback')

    with op.batch_alter_table('validation_results') as batch_op:
        try:
            batch_op.drop_column('sample_spread')
        except Exception:
            pass
        try:
            batch_op.drop_column('category')
        except Exception:
            pass
        try:
            batch_op.drop_column('rules_version')
        except Exception:
            pass
