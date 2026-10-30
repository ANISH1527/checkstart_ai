"""report_v1_schema_extensions

Revision ID: e2f3a4b5c6d7
Revises: c1d2e3f4a5b6
Create Date: 2026-10-30 09:00:00.000000

Adds:
  - validation_results: framework_name, previous_report_id, percentage,
    market_demand, problem_severity, competition, target_customer,
    innovation, feasibility, revenue_potential
  - ideas: location, competitors, usp, current_stage
  - audit_logs: duration_ms, user_id, idea_id
  - idea_embeddings: (id, idea_id, version, model_name, vector, text_hash, created_at)
  - report_analyses: (id, validation_id, strengths, weaknesses, risks, recommendations, evidence, created_at)
"""
from alembic import op
import sqlalchemy as sa

revision = 'e2f3a4b5c6d7'
down_revision = 'c1d2e3f4a5b6'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)
    table_names = insp.get_table_names()

    # 1. Extend validation_results
    if 'validation_results' in table_names:
        vr_cols = [c['name'] for c in insp.get_columns('validation_results')]
        with op.batch_alter_table('validation_results') as batch_op:
            if 'framework_name' not in vr_cols:
                batch_op.add_column(sa.Column('framework_name', sa.String(length=50), nullable=True, server_default='report_v1'))
            if 'previous_report_id' not in vr_cols:
                batch_op.add_column(sa.Column('previous_report_id', sa.Integer(), nullable=True))
            if 'percentage' not in vr_cols:
                batch_op.add_column(sa.Column('percentage', sa.Float(), nullable=True))
            if 'market_demand' not in vr_cols:
                batch_op.add_column(sa.Column('market_demand', sa.Float(), nullable=True))
            if 'problem_severity' not in vr_cols:
                batch_op.add_column(sa.Column('problem_severity', sa.Float(), nullable=True))
            if 'competition' not in vr_cols:
                batch_op.add_column(sa.Column('competition', sa.Float(), nullable=True))
            if 'target_customer' not in vr_cols:
                batch_op.add_column(sa.Column('target_customer', sa.Float(), nullable=True))
            if 'innovation' not in vr_cols:
                batch_op.add_column(sa.Column('innovation', sa.Float(), nullable=True))
            if 'feasibility' not in vr_cols:
                batch_op.add_column(sa.Column('feasibility', sa.Float(), nullable=True))
            if 'revenue_potential' not in vr_cols:
                batch_op.add_column(sa.Column('revenue_potential', sa.Float(), nullable=True))

    # 2. Extend ideas
    if 'ideas' in table_names:
        idea_cols = [c['name'] for c in insp.get_columns('ideas')]
        with op.batch_alter_table('ideas') as batch_op:
            if 'location' not in idea_cols:
                batch_op.add_column(sa.Column('location', sa.String(length=100), nullable=True))
            if 'competitors' not in idea_cols:
                batch_op.add_column(sa.Column('competitors', sa.Text(), nullable=True))
            if 'usp' not in idea_cols:
                batch_op.add_column(sa.Column('usp', sa.Text(), nullable=True))
            if 'current_stage' not in idea_cols:
                batch_op.add_column(sa.Column('current_stage', sa.String(length=50), nullable=True, server_default='idea'))

    # 3. Extend audit_logs
    if 'audit_logs' in table_names:
        audit_cols = [c['name'] for c in insp.get_columns('audit_logs')]
        with op.batch_alter_table('audit_logs') as batch_op:
            if 'duration_ms' not in audit_cols:
                batch_op.add_column(sa.Column('duration_ms', sa.Integer(), nullable=True))
            if 'user_id' not in audit_cols:
                batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
            if 'idea_id' not in audit_cols:
                batch_op.add_column(sa.Column('idea_id', sa.Integer(), nullable=True))

    # 4. Create idea_embeddings table
    if 'idea_embeddings' not in table_names:
        op.create_table(
            'idea_embeddings',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('idea_id', sa.Integer(), nullable=True),
            sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('model_name', sa.String(length=100), nullable=False, server_default='all-MiniLM-L6-v2'),
            sa.Column('vector', sa.Text(), nullable=False),
            sa.Column('text_hash', sa.String(length=64), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['idea_id'], ['ideas.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_idea_embeddings_idea_id', 'idea_embeddings', ['idea_id'])
        op.create_index('ix_idea_embeddings_text_hash', 'idea_embeddings', ['text_hash'])

    # 5. Create report_analyses table
    if 'report_analyses' not in table_names:
        op.create_table(
            'report_analyses',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('validation_id', sa.Integer(), nullable=False),
            sa.Column('strengths', sa.JSON(), nullable=True),
            sa.Column('weaknesses', sa.JSON(), nullable=True),
            sa.Column('risks', sa.JSON(), nullable=True),
            sa.Column('recommendations', sa.JSON(), nullable=True),
            sa.Column('evidence', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['validation_id'], ['validation_results.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_report_analyses_validation_id', 'report_analyses', ['validation_id'])


def downgrade():
    bind = op.get_bind()
    insp = sa.inspect(bind)
    table_names = insp.get_table_names()

    if 'report_analyses' in table_names:
        op.drop_index('ix_report_analyses_validation_id', table_name='report_analyses')
        op.drop_table('report_analyses')

    if 'idea_embeddings' in table_names:
        op.drop_index('ix_idea_embeddings_text_hash', table_name='idea_embeddings')
        op.drop_index('ix_idea_embeddings_idea_id', table_name='idea_embeddings')
        op.drop_table('idea_embeddings')

    if 'audit_logs' in table_names:
        with op.batch_alter_table('audit_logs') as batch_op:
            for col in ['idea_id', 'user_id', 'duration_ms']:
                try:
                    batch_op.drop_column(col)
                except Exception:
                    pass

    if 'ideas' in table_names:
        with op.batch_alter_table('ideas') as batch_op:
            for col in ['current_stage', 'usp', 'competitors', 'location']:
                try:
                    batch_op.drop_column(col)
                except Exception:
                    pass

    if 'validation_results' in table_names:
        with op.batch_alter_table('validation_results') as batch_op:
            for col in [
                'revenue_potential', 'feasibility', 'innovation', 'target_customer',
                'competition', 'problem_severity', 'market_demand', 'percentage',
                'previous_report_id', 'framework_name'
            ]:
                try:
                    batch_op.drop_column(col)
                except Exception:
                    pass
