import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'router.dart';

class AssistenteJW extends StatelessWidget {
  const AssistenteJW({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: "Assistente JW",

      debugShowCheckedModeBanner: false,

      routerConfig: router,

      locale: const Locale("pt", "BR"),

      supportedLocales: const [
        Locale("pt", "BR"),
      ],

      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      theme: ThemeData(
        colorSchemeSeed: Colors.indigo,
        useMaterial3: true,
      ),
    );
  }
}