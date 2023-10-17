import 'package:ehrenamtskarte/build_config/build_config.dart' show buildConfig;
import 'package:ehrenamtskarte/configuration/settings_model.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../util/l10n.dart';

class VerificationInfoDialog extends StatelessWidget {
  const VerificationInfoDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<SettingsModel>(context);
    final localization = buildConfig.localization.identification.verificationCodeScanner;
    return AlertDialog(
      title: Text(localization.infoDialogTitle),
      content: SingleChildScrollView(
        child: ListBody(
          children: [
            _EnumeratedListItem(
              index: 0,
              child: Text(context.l10n.identification_scanCode),
            ),
            _EnumeratedListItem(index: 1, child: Text(context.l10n.identification_checkingCode)),
            _EnumeratedListItem(
              index: 2,
              child: Text(context.l10n.identification_compareWithID),
            ),
            SizedBox(height: 12),
            Text(
              context.l10n.identification_internetRequired,
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          child: Text(context.l10n.identification_stopShowing),
          onPressed: () async {
            await settings.setHideVerificationInfo(enabled: true);
            _onDone(context);
          },
        ),
        TextButton(
          child: Text(context.l10n.common_next),
          onPressed: () => _onDone(context),
        )
      ],
    );
  }

  void _onDone(BuildContext context) => Navigator.of(context).pop(true);

  /// Shows a [VerificationInfoDialog].
  /// Returns a future that resolves to true if the user accepted the info,
  /// and to null if the dialog was dismissed.
  static Future<bool?> show(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (_) => const VerificationInfoDialog(),
    );
  }
}

class _EnumeratedListItem extends StatelessWidget {
  final int index;
  final Widget child;

  const _EnumeratedListItem({required this.index, required this.child});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: Theme.of(context).colorScheme.primary,
            child: Text(
              '${index + 1}',
              style: TextStyle(
                color: Theme.of(context).colorScheme.background,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: child),
        ],
      ),
    );
  }
}
