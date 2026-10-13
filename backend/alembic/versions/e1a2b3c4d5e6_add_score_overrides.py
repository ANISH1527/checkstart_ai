"""add_score_overrides

Revision ID: e1a2b3c4d5e6
Revises: d4e5f6a7b8c9
Create Date: 2026-10-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'e1a2b3c4d5e6'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('validation_results') as batch_op:
        try:
            batch_op.add_column(sa.Column('score_overrides', sa.JSON(), nullable=True))
        except Exception:
            pass


def downgrade():
    with op.batch_alter_table('validation_results') as batch_op:
        try:
            batch_op.drop_column('score_overrides')
        except Exception:
            pass
