// lib/providers/share_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/share/share_service.dart';

final shareServiceProvider = Provider<ShareService>((ref) {
  final service = ShareService();

  service.iniciar();

  ref.onDispose(service.dispose);

  return service;
});
