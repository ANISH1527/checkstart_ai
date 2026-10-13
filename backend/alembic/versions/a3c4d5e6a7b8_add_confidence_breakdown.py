"""add_confidence_breakdown

Revision ID: a3c4d5e6a7b8
Revises: f2b3c4d5e6a7
Create Date: 2026-10-12 12:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a3c4d5e6a7b8'
down_revision = 'f2b3c4d5e6a7'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('validation_results') as batch_op:
        try:
            batch_op.add_column(sa.Column('confidence_breakdown', sa.JSON(), nullable=True))
        except Exception:
            pass


def downgrade():
    with op.batch_alter_table('validation_results') as batch_op:
        try:
            batch_op.drop_column('confidence_breakdown')
        except Exception:
            pass
