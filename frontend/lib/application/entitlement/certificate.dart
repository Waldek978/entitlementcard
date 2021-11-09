import 'package:flutter/material.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_image_picker/form_builder_image_picker.dart';
import 'package:provider/provider.dart';

import '../application_model.dart';
import '../textwidgets/form_text.dart';

class Certificate extends StatelessWidget {
  final GlobalKey<FormBuilderState> formKey;
  final String title;

  const Certificate({Key? key, required this.formKey, required this.title}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    var applicationModel =
        Provider.of<ApplicationModel>(context, listen: false);
    var entitlement = applicationModel.goldenCardApplication?.entitlement;
    return FormBuilder(
        key: formKey,
        child: Column(
          children: <Widget>[
            FormText(
              title,
            ),
            FormBuilderImagePicker(
              name: 'certificate',
              decoration: const InputDecoration(labelText: 'Kopie oder Foto'),
              validator: FormBuilderValidators.required(context),
              maxImages: 1,
              iconColor: Theme.of(context).colorScheme.primary,
              initialValue: entitlement?.certificate != null
                  ? [applicationModel.attachment]
                  : [],
              onSaved: (value) => {
                if (value != null) {
                  applicationModel.attachment = value.first,
                }
              },
            ),
          ],
        ));
  }
}
