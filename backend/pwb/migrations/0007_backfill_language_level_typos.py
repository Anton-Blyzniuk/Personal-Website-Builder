from django.db import migrations


def fix_language_levels(apps, schema_editor):
    Language = apps.get_model("pwb", "Language")
    Language.objects.filter(level="A1 Begginer").update(level="A1 Beginner")
    Language.objects.filter(level="C2 Advanced Proficy").update(level="C2 Advanced Proficiency")


class Migration(migrations.Migration):

    dependencies = [
        ("pwb", "0006_fix_language_level_choices"),
    ]

    operations = [
        migrations.RunPython(fix_language_levels, migrations.RunPython.noop),
    ]
