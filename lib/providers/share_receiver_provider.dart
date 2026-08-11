// lib/providers/share_receiver_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/share/share_receiver_manager.dart';
import 'database_provider.dart';

final shareReceiverProvider =
    Provider<ShareReceiverManager>((ref) {
  return ShareReceiverManager(
    ref.watch(databaseProvider),
  );
});
