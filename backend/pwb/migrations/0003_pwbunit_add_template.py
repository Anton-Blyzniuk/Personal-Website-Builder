from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pwb', '0002_cv_structure_redesign'),
    ]

    operations = [
        migrations.AddField(
            model_name='pwbunit',
            name='template',
            field=models.CharField(
                choices=[('classic', 'Classic'), ('modern', 'Modern'), ('minimal', 'Minimal')],
                default='classic',
                max_length=20,
            ),
        ),
    ]
