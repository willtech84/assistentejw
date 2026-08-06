// lib/services/notificacoes/notificacao_service.dart

import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificacaoService {
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  Future<void> iniciar() async {
    const android = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );

    await _plugin.initialize(
      const InitializationSettings(
        android: android,
      ),
    );
  }

  Future<void> mostrar({
    required int id,
    required String titulo,
    required String mensagem,
  }) async {
    await _plugin.show(
      id,
      titulo,
      mensagem,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'agenda',
          'Agenda',
          importance: Importance.max,
          priority: Priority.high,
        ),
      ),
    );
  }
}
