"""add_version_pinning_columns

Revision ID: b4d5e6a7b8c9
Revises: a3c4d5e6a7b8
Create Date: 2026-10-12 12:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b4d5e6a7b8c9'
down_revision = 'a3c4d5e6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('validation_results') as batch_op:
        try:
            batch_op.add_column(sa.Column('embedding_model_version', sa.String(length=50), nullable=True))
        except Exception:
            pass
        try:
            batch_op.add_column(sa.Column('scoring_version', sa.String(length=50), nullable=True))
        except Exception:
            pass


def downgrade():
    with op.batch_alter_table('validation_results') as batch_op:
        try:
            batch_op.drop_column('scoring_version')
        except Exception:
            pass
        try:
            batch_op.drop_column('embedding_model_version')
        except Exception:
            pass
