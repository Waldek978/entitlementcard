import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';

import '../card_details.dart';
import '../card_details_model.dart';
import '../jwt/invalid_jwt_exception.dart';
import '../jwt/parse_jwt.dart';

const flashOn = 'Blitz an';
const flashOff = 'Blitz aus';
const frontCamera = 'Frontkamera';
const backCamera = 'Standard Kamera';

class QRCodeScanner extends StatefulWidget {
  const QRCodeScanner({
    Key key,
  }) : super(key: key);

  @override
  State<QRCodeScanner> createState() => _QRViewExampleState();
}

class _QRViewExampleState extends State<QRCodeScanner> {
  Barcode result;
  var flashState = flashOn;
  var cameraState = frontCamera;
  QRViewController controller;
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  bool isDone = false;
  bool isErrorDialogActive = false;

  // In order to get hot reload to work we need to pause the camera if the platform
  // is android, or resume the camera if the platform is iOS.
  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      controller.pauseCamera();
    } else if (Platform.isIOS) {
      controller.resumeCamera();
    }
  }

  @override
  Widget build(BuildContext context) {
    isDone = false;
    return Scaffold(
      body: Column(
        children: <Widget>[
          Expanded(
              flex: 4,
              child: Scaffold(
                appBar: AppBar(
                  leading: new IconButton(
                    icon: new Icon(
                      Icons.arrow_back_ios,
                      color: Theme.of(context).textTheme.bodyText1.color,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  title: Text("Ehrenamtskarte hinzufügen"),
                ),
                body: _buildQrView(context),
              )),
          Expanded(
            flex: 1,
            child: FittedBox(
              fit: BoxFit.contain,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: <Widget>[
                  Container(
                    margin: EdgeInsets.all(8),
                    child: Text('Halten Sie die Kamera auf den QR Code.'),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: <Widget>[
                      Container(
                        margin: EdgeInsets.all(8),
                        child: OutlineButton(
                          onPressed: () {
                            if (controller != null) {
                              controller.toggleFlash();
                              setState(() {
                                flashState =
                                    _isFlashOn(flashState) ? flashOff : flashOn;
                              });
                            }
                          },
                          child:
                              Text(flashState, style: TextStyle(fontSize: 16)),
                        ),
                      ),
                      Container(
                        margin: EdgeInsets.all(8),
                        child: OutlineButton(
                          onPressed: () {
                            if (controller != null) {
                              controller.flipCamera();
                              setState(() {
                                cameraState = _isBackCamera(cameraState)
                                    ? frontCamera
                                    : backCamera;
                              });
                            }
                          },
                          child:
                              Text(cameraState, style: TextStyle(fontSize: 16)),
                        ),
                      )
                    ],
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  bool _isFlashOn(String current) {
    return flashOn == current;
  }

  bool _isBackCamera(String current) {
    return backCamera == current;
  }

  Widget _buildQrView(BuildContext context) {
    // For this example we check how width or tall the device is and change the scanArea and overlay accordingly.
    var scanArea = (MediaQuery.of(context).size.width < 400 ||
            MediaQuery.of(context).size.height < 400)
        ? 150.0
        : 300.0;
    // To ensure the Scanner view is properly sizes after rotation
    // we need to listen for Flutter SizeChanged notification and update controller
    return NotificationListener<SizeChangedLayoutNotification>(
        onNotification: (notification) {
          Future.microtask(
              () => controller?.updateDimensions(qrKey, scanArea: scanArea));
          return false;
        },
        child: SizeChangedLayoutNotifier(
            key: const Key('qr-size-notifier'),
            child: QRView(
              key: qrKey,
              onQRViewCreated: _onQRViewCreated,
              overlay: QrScannerOverlayShape(
                borderColor: Colors.red,
                borderRadius: 10,
                borderLength: 30,
                borderWidth: 10,
                cutOutSize: scanArea,
              ),
            )));
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      if (scanData != null) {
        _parseCodeContent(scanData.code);
      }
    });
  }

  void _parseCodeContent(String codeContent) {
    print("Scan successful, reading payload...");
    try {
      var payload = parseJwtPayLoad(codeContent);
      String firstName = payload["firstName"];
      String lastName = payload["lastName"];

      if (firstName == null || lastName == null) {
        throw Exception("Name konnte nicht aus QR Code gelesen werden.");
      }

      final expirationDate = DateTime.parse(payload["expirationDate"]);
      String region = payload["region"] ?? "";

      var cardDetails =
          CardDetails(firstName, lastName, expirationDate, region);
      if (isDone) {
        return;
      }
      isDone = true;
      Provider.of<CardDetailsModel>(context, listen: false)
          .setCardDetails(cardDetails);
      Navigator.of(context).maybePop();
    } catch (e) {
      controller.pauseCamera();
      print("Failed to parse qr code content!");
      print(e);
      String errorMessage;
      if (e is InvalidJwtException) {
        errorMessage =
            "Der Inhalt des QR-Codes entspricht keinem bekannten Format.";
      } else {
        errorMessage = e.toString();
      }
      if (isErrorDialogActive) {
        return;
      }
      isErrorDialogActive = true;
      _showMyDialog(errorMessage).then((value) {
        Future.delayed(Duration(milliseconds: 1000)).then((onValue) {
          isErrorDialogActive = false;
          controller.resumeCamera();
        });
      });
    }
  }

  Future<void> _showMyDialog(String message) async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false, // user must tap button!
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Fehler beim Lesen des Codes'),
          content: SingleChildScrollView(
            child: ListBody(
              children: <Widget>[
                Text(message),
              ],
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: Text('Ok'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
}
