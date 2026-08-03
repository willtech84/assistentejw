import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/splash/splash_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/designacoes/designacoes_screen.dart';
import 'screens/agenda/agenda_screen.dart';
import 'screens/compartilhamento/share_receiver_screen.dart';
import 'screens/configuracoes/configuracoes_screen.dart';
import 'screens/sobre/sobre_screen.dart';

final router = GoRouter(
  initialLocation: "/",

  routes: [

    GoRoute(
      path: "/",
      builder: (context, state) => const SplashScreen(),
    ),

    GoRoute(
      path: "/home",
      builder: (context, state) => const HomeScreen(),
    ),

    GoRoute(
      path: "/designacoes",
      builder: (context, state) => const DesignacoesScreen(),
    ),

    GoRoute(
      path: "/agenda",
      builder: (context, state) => const AgendaScreen(),
    ),

    GoRoute(
      path: "/share",
      builder: (context, state) => const ShareReceiverScreen(),
    ),

    GoRoute(
      path: "/configuracoes",
      builder: (context, state) => const ConfiguracoesScreen(),
    ),

    GoRoute(
      path: "/sobre",
      builder: (context, state) => const SobreScreen(),
    ),
  ],
);
