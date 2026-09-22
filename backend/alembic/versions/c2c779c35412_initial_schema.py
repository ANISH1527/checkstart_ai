"""initial_schema

Revision ID: c2c779c35412
Revises: None
Create Date: 2026-09-16 11:59:29.180065

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c2c779c35412'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    try:
        op.create_table('pipeline_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('idea_id', sa.Integer(), nullable=False),
        sa.Column('celery_task_id', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('result_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['idea_id'], ['ideas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['result_id'], ['validation_results.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_pipeline_jobs_celery_task_id'), 'pipeline_jobs', ['celery_task_id'], unique=True)
        op.create_index(op.f('ix_pipeline_jobs_id'), 'pipeline_jobs', ['id'], unique=False)
    except Exception:
        pass

    with op.batch_alter_table('ideas') as batch_op:
        try:
            batch_op.add_column(sa.Column('is_deleted', sa.Boolean(), server_default='0', nullable=False))
        except Exception:
            pass
        try:
            batch_op.add_column(sa.Column('deleted_at', sa.DateTime(), nullable=True))
        except Exception:
            pass
        try:
            batch_op.add_column(sa.Column('webhook_url', sa.Text(), nullable=True))
        except Exception:
            pass

    with op.batch_alter_table('recommendations') as batch_op:
        for col_name, col_type in [
            ('rec_id', sa.String(length=50)),
            ('parameter', sa.String(length=100)),
            ('current_score', sa.Float()),
            ('severity', sa.String(length=20)),
            ('root_cause', sa.Text()),
            ('missing_information', sa.Text()),
            ('objective', sa.Text()),
            ('why_it_matters', sa.Text()),
            ('validation_method', sa.Text()),
            ('expected_impact', sa.Text()),
            ('affected_parameters', sa.Text()),
        ]:
            try:
                batch_op.add_column(sa.Column(col_name, col_type, nullable=True))
            except Exception:
                pass
        try:
            batch_op.add_column(sa.Column('confidence', sa.Float(), server_default='0.85', nullable=False))
        except Exception:
            pass
        try:
            batch_op.add_column(sa.Column('status', sa.String(length=20), server_default='OPEN', nullable=False))
        except Exception:
            pass

    with op.batch_alter_table('users') as batch_op:
        try:
            batch_op.add_column(sa.Column('role', sa.String(length=20), server_default='USER', nullable=False))
        except Exception:
            pass

    with op.batch_alter_table('validation_results') as batch_op:
        try:
            batch_op.add_column(sa.Column('pipeline_timing', sa.JSON(), nullable=True))
        except Exception:
            pass
        try:
            batch_op.create_unique_constraint('uq_validation_result_idea_version', ['idea_id', 'version'])
        except Exception:
            pass


def downgrade():
    try:
        op.drop_table('pipeline_jobs')
    except Exception:
        pass
