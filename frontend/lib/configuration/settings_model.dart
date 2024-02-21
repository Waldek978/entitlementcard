import 'dart:developer';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsModel extends ChangeNotifier {
  SharedPreferences? _preferences;

  Future<void> initialize() async {
    if (_preferences != null) {
      // Already initialized
      return;
    }

    _preferences = await SharedPreferences.getInstance();
  }

  Future<void> clearSettings() async {
    await _preferences?.clear();
    notifyListeners();
  }

  bool? _getBool(String key) {
    final obj = _preferences?.get(key);
    if (obj == null) {
      return null;
    } else if (obj is! bool) {
      log('Preference key $key has wrong type: Expected bool, but got ${obj.runtimeType}. Returning fallback.',
          level: 1000);
      return null;
    }
    return obj;
  }

  String? _getString(String key) {
    final obj = _preferences?.get(key);
    if (obj == null) {
      return null;
    } else if (obj is! String) {
      log('Preference key $key has wrong type: Expected string, but got ${obj.runtimeType}. Returning fallback.',
          level: 1000);
      return null;
    }
    return obj;
  }

  String firstStartKey = 'firstStart';
  bool get firstStart => _getBool(firstStartKey) ?? true;

  Future<void> setFirstStart({required bool enabled}) async {
    bool? currentlyFirstStartEnabled = firstStart;
    await _preferences?.setBool(firstStartKey, enabled);
    notifyChange(currentlyFirstStartEnabled, enabled);
  }

  String enableStagingKey = 'enableStaging';
  bool get enableStaging => _getBool(enableStagingKey) ?? false;

  Future<void> setEnableStaging({required bool enabled}) async {
    bool? currentlyEnabledStaging = enableStaging;
    await _preferences?.setBool(enableStagingKey, enabled);
    notifyChange(currentlyEnabledStaging, enabled);
  }

  String hideVerificationInfoKey = 'hideVerificationInfo';
  bool get hideVerificationInfo => _getBool(hideVerificationInfoKey) ?? true;

  Future<void> setHideVerificationInfo({required bool enabled}) async {
    bool? currentlyHideVerificationInfo = hideVerificationInfo;
    await _preferences?.setBool(hideVerificationInfoKey, enabled);
    notifyChange(currentlyHideVerificationInfo, enabled);
  }

  String locationFeatureKey = 'location';
  bool get locationFeatureEnabled => _getBool(locationFeatureKey) ?? false;

  Future<void> setLocationFeatureEnabled({required bool enabled}) async {
    bool? currentlyLocationFeatureEnabled = locationFeatureEnabled;
    await _preferences?.setBool(locationFeatureKey, enabled);
    notifyChange(currentlyLocationFeatureEnabled, enabled);
  }

  String languageKey= 'language';
  String? get language => _getString(languageKey);

  Future<void> setLanguage({required String language}) async {
    String? currentLanguage = language;
    await _preferences?.setString(languageKey, language);
    notifyChange(currentLanguage, language);
  }

  @override
  String toString() {
    return 'SettingsModel{firstStart: $firstStart, hideVerificationInfo: $hideVerificationInfo, locationFeatureEnabled: $locationFeatureEnabled, enableStaging:$enableStaging, language:$language}';
  }

  // only notify if value has changed
  void notifyChange(dynamic oldValue, dynamic newValue) {
    if(oldValue != newValue) {
      notifyListeners();
    }
  }
}
