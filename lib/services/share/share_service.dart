// lib/services/share/share_service.dart

import 'dart:async';

import 'package:receive_sharing_intent/receive_sharing_intent.dart';

class ShareService {
  final _controller = StreamController<List<SharedMediaFile>>.broadcast();

  Stream<List<SharedMediaFile>> get stream => _controller.stream;

  Future<void> iniciar() async {
    ReceiveSharingIntent.instance.getMediaStream().listen((files) {
      _controller.add(files);
    });

    final initial =
        await ReceiveSharingIntent.instance.getInitialMedia();

    if (initial.isNotEmpty) {
      _controller.add(initial);
    }
  }

  void dispose() {
    _controller.close();
  }
}
