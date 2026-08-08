// lib/widgets/app_logo.dart

import 'package:flutter/material.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: const [

        Icon(
          Icons.assignment_ind,
          size: 80,
        ),

        SizedBox(height: 12),

        Text(
          "Assistente JW",
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
