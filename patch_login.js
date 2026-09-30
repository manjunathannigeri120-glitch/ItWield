import fs from 'fs';
let file = 'frontend/src/pages/Login.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const { error } = await supabase.auth.signUp({\n            email,\n            password,\n          });",
  "const { error } = await supabase.auth.signUp({\n            email,\n            password,\n            options: {\n              emailRedirectTo: window.location.origin\n            }\n          });"
);

content = content.replace(
  "const { error } = await supabase.auth.resetPasswordForEmail(email);",
  "const { error } = await supabase.auth.resetPasswordForEmail(email, {\n          redirectTo: window.location.origin\n        });"
);

fs.writeFileSync(file, content);
