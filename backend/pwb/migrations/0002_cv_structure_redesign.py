import django.db.models.deletion
from django.db import migrations, models
from django.db.models import F, Q


class Migration(migrations.Migration):

    dependencies = [
        ("pwb", "0001_initial"),
    ]

    operations = [
        # 1. PWBUnit: fix first_name typo
        migrations.RenameField(
            model_name="pwbunit",
            old_name="frist_name",
            new_name="first_name",
        ),
        # 2. PWBUnit: rename profession → headline
        migrations.RenameField(
            model_name="pwbunit",
            old_name="profession",
            new_name="headline",
        ),
        # 3. PWBUnit: extend headline to 120 chars
        migrations.AlterField(
            model_name="pwbunit",
            name="headline",
            field=models.CharField(max_length=120),
        ),
        # 4. PWBUnit: add phone
        migrations.AddField(
            model_name="pwbunit",
            name="phone",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        # 5. PWBUnit: add location
        migrations.AddField(
            model_name="pwbunit",
            name="location",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        # 6. Skill: add category
        migrations.AddField(
            model_name="skill",
            name="category",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        # 7. Skill: add level
        migrations.AddField(
            model_name="skill",
            name="level",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Beginner", "Beginner"),
                    ("Intermediate", "Intermediate"),
                    ("Advanced", "Advanced"),
                    ("Expert", "Expert"),
                ],
                max_length=20,
                null=True,
            ),
        ),
        # 8. Skill: add order
        migrations.AddField(
            model_name="skill",
            name="order",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        # 9. ExperienceUnit: rename name → title
        migrations.RenameField(
            model_name="experienceunit",
            old_name="name",
            new_name="title",
        ),
        # ExperienceUnit: extend title to 120 chars (was 100)
        migrations.AlterField(
            model_name="experienceunit",
            name="title",
            field=models.CharField(max_length=120),
        ),
        # 10. ExperienceUnit: make to_date nullable (null = present)
        migrations.AlterField(
            model_name="experienceunit",
            name="to_date",
            field=models.DateField(blank=True, null=True),
        ),
        # 11. ExperienceUnit: add organization
        migrations.AddField(
            model_name="experienceunit",
            name="organization",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        # 12. ExperienceUnit: add location
        migrations.AddField(
            model_name="experienceunit",
            name="location",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        # 13. ExperienceUnit: add order
        migrations.AddField(
            model_name="experienceunit",
            name="order",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        # 14. ExperienceUnit: drop old strict constraint
        migrations.RemoveConstraint(
            model_name="experienceunit",
            name="experience_to_date_after_from_date",
        ),
        # 15. ExperienceUnit: add partial constraint (allows null to_date)
        migrations.AddConstraint(
            model_name="experienceunit",
            constraint=models.CheckConstraint(
                condition=models.Q(to_date__isnull=True) | models.Q(to_date__gt=models.F("from_date")),
                name="experience_to_date_after_from_date",
            ),
        ),
        # 16. EducationUnit: rename name → institution
        migrations.RenameField(
            model_name="educationunit",
            old_name="name",
            new_name="institution",
        ),
        # EducationUnit: extend institution to 150 chars (was 100)
        migrations.AlterField(
            model_name="educationunit",
            name="institution",
            field=models.CharField(max_length=150),
        ),
        # 17. EducationUnit: make to_date nullable (null = ongoing)
        migrations.AlterField(
            model_name="educationunit",
            name="to_date",
            field=models.DateField(blank=True, null=True),
        ),
        # 18. EducationUnit: add degree
        migrations.AddField(
            model_name="educationunit",
            name="degree",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        # 19. EducationUnit: add field_of_study
        migrations.AddField(
            model_name="educationunit",
            name="field_of_study",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        # 20. EducationUnit: add location
        migrations.AddField(
            model_name="educationunit",
            name="location",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        # 21. EducationUnit: add order
        migrations.AddField(
            model_name="educationunit",
            name="order",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        # 22. EducationUnit: drop old strict constraint
        migrations.RemoveConstraint(
            model_name="educationunit",
            name="education_to_date_after_from_date",
        ),
        # 23. EducationUnit: add partial constraint (allows null to_date)
        migrations.AddConstraint(
            model_name="educationunit",
            constraint=models.CheckConstraint(
                condition=models.Q(to_date__isnull=True) | models.Q(to_date__gt=models.F("from_date")),
                name="education_to_date_after_from_date",
            ),
        ),
        # 24. Rename model Project → PortfolioItem
        migrations.RenameModel(
            old_name="Project",
            new_name="PortfolioItem",
        ),
        # 25. PortfolioItem: update FK related_name to portfolio_items
        migrations.AlterField(
            model_name="portfolioitem",
            name="pwb_unit",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="portfolio_items",
                to="pwb.pwbunit",
            ),
        ),
        # 26. PortfolioItem: rename name → title
        migrations.RenameField(
            model_name="portfolioitem",
            old_name="name",
            new_name="title",
        ),
        # PortfolioItem: extend title to 150 chars (was 100)
        migrations.AlterField(
            model_name="portfolioitem",
            name="title",
            field=models.CharField(max_length=150),
        ),
        # 27. PortfolioItem: add category
        migrations.AddField(
            model_name="portfolioitem",
            name="category",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        # 28. PortfolioItem: add date
        migrations.AddField(
            model_name="portfolioitem",
            name="date",
            field=models.DateField(blank=True, null=True),
        ),
        # 29. PortfolioItem: add order
        migrations.AddField(
            model_name="portfolioitem",
            name="order",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        # 30. Rename model ProjectLink → PortfolioItemLink
        migrations.RenameModel(
            old_name="ProjectLink",
            new_name="PortfolioItemLink",
        ),
        # 31. PortfolioItemLink: rename FK project → portfolio_item
        migrations.RenameField(
            model_name="portfolioitemlink",
            old_name="project",
            new_name="portfolio_item",
        ),
        # 32. New model: Certification
        migrations.CreateModel(
            name="Certification",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=150)),
                ("issuing_organization", models.CharField(max_length=150)),
                ("issue_date", models.DateField(blank=True, null=True)),
                ("expiry_date", models.DateField(blank=True, null=True)),
                ("credential_id", models.CharField(blank=True, max_length=100, null=True)),
                ("credential_url", models.URLField(blank=True, null=True)),
                ("order", models.PositiveSmallIntegerField(default=0)),
                (
                    "pwb_unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="certifications",
                        to="pwb.pwbunit",
                    ),
                ),
            ],
            options={
                "ordering": ["order"],
            },
        ),
        # 33. New model: Award
        migrations.CreateModel(
            name="Award",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=150)),
                ("issuer", models.CharField(blank=True, max_length=150, null=True)),
                ("date", models.DateField(blank=True, null=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("order", models.PositiveSmallIntegerField(default=0)),
                (
                    "pwb_unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="awards",
                        to="pwb.pwbunit",
                    ),
                ),
            ],
            options={
                "ordering": ["order"],
            },
        ),
        # 34. New model: CustomSection
        migrations.CreateModel(
            name="CustomSection",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=150)),
                ("order", models.PositiveSmallIntegerField(default=0)),
                (
                    "pwb_unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_sections",
                        to="pwb.pwbunit",
                    ),
                ),
            ],
            options={
                "ordering": ["order"],
            },
        ),
        # 35. New model: CustomSectionItem
        migrations.CreateModel(
            name="CustomSectionItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=150)),
                ("subtitle", models.CharField(blank=True, max_length=150, null=True)),
                ("from_date", models.DateField(blank=True, null=True)),
                ("to_date", models.DateField(blank=True, null=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("url", models.URLField(blank=True, null=True)),
                ("order", models.PositiveSmallIntegerField(default=0)),
                (
                    "section",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="pwb.customsection",
                    ),
                ),
            ],
            options={
                "ordering": ["order"],
            },
        ),
        # AlterModelOptions: add ordering to existing models
        migrations.AlterModelOptions(
            name="skill",
            options={"ordering": ["order"]},
        ),
        migrations.AlterModelOptions(
            name="experienceunit",
            options={"ordering": ["order"]},
        ),
        migrations.AlterModelOptions(
            name="educationunit",
            options={"ordering": ["order"]},
        ),
        migrations.AlterModelOptions(
            name="portfolioitem",
            options={"ordering": ["order"]},
        ),
    ]
