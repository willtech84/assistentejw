// lib/providers/theme_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AppThemeMode {
  system,
  light,
  dark,
}

class ThemeNotifier extends Notifier<AppThemeMode> {
  @override
  AppThemeMode build() {
    return AppThemeMode.system;
  }

  void setTheme(AppThemeMode mode) {
    state = mode;
  }
}

final themeProvider =
    NotifierProvider<ThemeNotifier, AppThemeMode>(
  ThemeNotifier.new,
);
