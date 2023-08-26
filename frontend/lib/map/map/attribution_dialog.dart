import 'package:ehrenamtskarte/map/map/attribution_dialog_item.dart';
import 'package:flutter/material.dart';
import 'package:flutter_i18n/flutter_i18n.dart';
import 'package:url_launcher/url_launcher_string.dart';

import '../../util/i18n.dart';

class AttributionDialog extends StatelessWidget {
  const AttributionDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.primary;
    return SimpleDialog(
      title: I18nText('mapData'),
      children: [
        AttributionDialogItem(
          icon: Icons.copyright,
          color: color,
          text: t(context, 'osmContributors'),
          onPressed: () {
            launchUrlString("https://www.openstreetmap.org/copyright", mode: LaunchMode.externalApplication);
          },
        ),
        AttributionDialogItem(
          icon: Icons.copyright,
          color: color,
          text: "OpenMapTiles",
          onPressed: () {
            launchUrlString("https://openmaptiles.org/", mode: LaunchMode.externalApplication);
          },
        ),
        AttributionDialogItem(
          icon: Icons.copyright,
          color: color,
          text: "Natural Earth",
          onPressed: () {
            launchUrlString("https://naturalearthdata.com/", mode: LaunchMode.externalApplication);
          },
        ),
        AttributionDialogItem(
          icon: Icons.copyright,
          color: color,
          text: "LBE Bayern",
          onPressed: () {
            launchUrlString("https://www.lbe.bayern.de/", mode: LaunchMode.externalApplication);
          },
        )
      ],
    );
  }
}
