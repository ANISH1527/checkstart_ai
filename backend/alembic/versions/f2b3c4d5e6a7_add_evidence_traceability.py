"""add_evidence_traceability

Revision ID: f2b3c4d5e6a7
Revises: e1a2b3c4d5e6
Create Date: 2026-10-12 12:05:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'f2b3c4d5e6a7'
down_revision = 'e1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('evidence') as batch_op:
        try:
            batch_op.add_column(sa.Column('claim_type', sa.String(length=100), nullable=True))
        except Exception:
            pass


def downgrade():
    with op.batch_alter_table('evidence') as batch_op:
        try:
            batch_op.drop_column('claim_type')
        except Exception:
            pass
