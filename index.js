import { registerRootComponent } from 'expo';
import App from './App';

function injectClerkCaptcha() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('clerk-captcha')) return;
  const div = document.createElement('div');
  div.id = 'clerk-captcha';
  document.body.appendChild(div);
}

injectClerkCaptcha();
registerRootComponent(App);
