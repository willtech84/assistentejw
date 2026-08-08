// lib/theme/app_theme.dart

import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTheme {
  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      colorSchemeSeed: AppColors.primary,
      scaffoldBackgroundColor: AppColors.background,
      cardTheme: const CardThemeData(
        elevation: 2,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
      ),
    );
  }

  static ThemeData dark() {
    return ThemeData.dark(
      useMaterial3: true,
    );
  }
}
