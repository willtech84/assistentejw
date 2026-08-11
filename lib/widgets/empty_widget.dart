// lib/widgets/empty_widget.dart

import 'package:flutter/material.dart';

class EmptyWidget extends StatelessWidget {
  final String mensagem;

  const EmptyWidget({
    super.key,
    required this.mensagem,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        mensagem,
        textAlign: TextAlign.center,
      ),
    );
  }
}
