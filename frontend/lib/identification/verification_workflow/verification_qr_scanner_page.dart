import 'dart:typed_data';

import 'package:ehrenamtskarte/build_config/build_config.dart' show buildConfig;
import 'package:ehrenamtskarte/configuration/configuration.dart';
import 'package:ehrenamtskarte/configuration/settings_model.dart';
import 'package:ehrenamtskarte/identification/connection_failed_dialog.dart';
import 'package:ehrenamtskarte/identification/otp_generator.dart';
import 'package:ehrenamtskarte/identification/qr_code_scanner/qr_code_processor.dart';
import 'package:ehrenamtskarte/identification/qr_code_scanner/qr_code_scanner_page.dart';
import 'package:ehrenamtskarte/identification/qr_content_parser.dart';
import 'package:ehrenamtskarte/identification/user_code_model.dart';
import 'package:ehrenamtskarte/identification/verification_workflow/dialogs/negative_verification_result_dialog.dart';
import 'package:ehrenamtskarte/identification/verification_workflow/dialogs/positive_verification_result_dialog.dart';
import 'package:ehrenamtskarte/identification/verification_workflow/dialogs/verification_info_dialog.dart';
import 'package:ehrenamtskarte/identification/verification_workflow/query_server_verification.dart';
import 'package:ehrenamtskarte/identification/verification_workflow/verification_qr_code_processor.dart';
import 'package:ehrenamtskarte/proto/card.pb.dart';
import 'package:ehrenamtskarte/widgets/app_bars.dart' show CustomAppBar;
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

class VerificationQrScannerPage extends StatelessWidget {
  const VerificationQrScannerPage({super.key});

  @override
  Widget build(BuildContext context) {
    final config = Configuration.of(context);
    final settings = Provider.of<SettingsModel>(context);
    return Column(
      children: [
        CustomAppBar(
          title: buildConfig.localization.identification.verificationCodeScanner.title,
          actions: [
            IconButton(
              icon: const Icon(Icons.help),
              color: Theme.of(context).appBarTheme.foregroundColor,
              onPressed: () async {
                await settings.setHideVerificationInfo(enabled: false);
                await VerificationInfoDialog.show(context);
              },
            )
          ],
        ),
        Expanded(
          child: QrCodeScannerPage(
            onCodeScanned: (code) => _handleQrCode(context, code),
          ),
        ),
        if (config.showDevSettings)
          TextButton(
            onPressed: () async {
              final provider = Provider.of<UserCodeModel>(context, listen: false);
              final userCode = provider.userCode!;
              final otp = OTPGenerator(userCode.totpSecret).generateOTP().code;
              final verificationQrCode = QrCode()
                ..dynamicVerificationCode = (DynamicVerificationCode()
                  ..info = userCode.info
                  ..pepper = userCode.pepper
                  ..otp = otp);
              final verificationCode = verificationQrCode.writeToBuffer();
              _handleQrCode(context, verificationCode);
            },
            child: const Text("Verify activated Card"),
          )
      ],
    );
  }

  Future<void> _handleQrCode(BuildContext context, Uint8List rawQrContent) async {
    try {
      final qrcode = rawQrContent.parseQRCodeContent();

      final cardInfo = await verifyQrCodeContent(context, qrcode);
      if (cardInfo == null) {
        await _onError(
          context,
          "Der eingescannte Code konnte vom Server nicht verifiziert werden!",
        );
      } else {
        await _onSuccess(context, cardInfo, qrcode.hasStaticVerificationCode());
      }
    } on ServerVerificationException catch (e) {
      await _onConnectionError(
        context,
        "Der eingescannte Code konnte nicht verifiziert "
        "werden, da die Kommunikation mit dem Server fehlschlug. "
        "Bitte prüfen Sie Ihre Internetverbindung.",
        e,
      );
    } on QrCodeFieldMissingException catch (e) {
      await _onError(
        context,
        "Der eingescannte Code ist nicht gültig, "
        "da erforderliche Daten fehlen.",
        e,
      );
    } on CardExpiredException catch (e) {
      final dateFormat = DateFormat("dd.MM.yyyy");
      await _onError(
        context,
        "Der eingescannte Code ist bereits am ${dateFormat.format(e.expiry)} abgelaufen.",
        e,
      );
    } on QrCodeParseException catch (e) {
      await _onError(
        context,
        "Der Inhalt des eingescannten Codes kann nicht verstanden "
        "werden. Vermutlich handelt es sich um einen QR-Code, der nicht für "
        "diese App generiert wurde.",
        e,
      );
    } on Exception catch (e) {
      await _onError(
        context,
        "Beim Einlesen des QR-Codes ist ein unbekannter Fehler aufgetreten.",
        e,
      );
    } finally {
      // close current "Karte verifizieren" view
      await Navigator.of(context).maybePop();
    }
  }

  Future<void> _onError(BuildContext context, String message, [Exception? exception]) async {
    if (exception != null) {
      debugPrint("Verification failed: $exception");
    }
    await NegativeVerificationResultDialog.show(context, message);
  }

  Future<void> _onConnectionError(BuildContext context, String message, [Exception? exception]) async {
    if (exception != null) {
      debugPrint("Connection failed: $exception");
    }
    await ConnectionFailedDialog.show(context, message);
  }

  Future<void> _onSuccess(BuildContext context, CardInfo cardInfo, bool isStaticVerificationCode) async {
    await PositiveVerificationResultDialog.show(
        context: context, cardInfo: cardInfo, isStaticVerificationCode: isStaticVerificationCode);
  }
}
