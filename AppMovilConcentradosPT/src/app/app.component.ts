import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { CartService } from './services/cart.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly appLinkHosts = this.getConfiguredAppLinkHosts();

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router
  ) {
    void this.cartService.init();
    this.registerAppUrlListener();
  }

  private registerAppUrlListener(): void {
    void App.addListener('appUrlOpen', ({ url }) => {
      const targetUrl = this.resolveDeepLink(url);
      if (!targetUrl) {
        return;
      }

      void this.router.navigateByUrl(targetUrl);
    });
  }

  private resolveDeepLink(rawUrl: string): string | null {
    try {
      const parsedUrl = new URL(rawUrl);

      if (parsedUrl.protocol !== 'concentradospt:') {
        if (!this.isConfiguredAppLink(parsedUrl)) {
          return null;
        }

        if (parsedUrl.pathname === '/auth/callback') {
          return `/auth/callback${parsedUrl.search}${parsedUrl.hash}`;
        }

        if (parsedUrl.pathname === '/cuenta' || parsedUrl.pathname === '/auth/signout') {
          return '/cuenta';
        }

        return null;
      }

      if (parsedUrl.host === 'auth' && parsedUrl.pathname === '/callback') {
        return `/auth/callback${parsedUrl.search}${parsedUrl.hash}`;
      }

      if (parsedUrl.host === 'auth' && parsedUrl.pathname === '/signout') {
        return '/cuenta';
      }

      return null;
    } catch {
      return null;
    }
  }

  private getConfiguredAppLinkHosts(): string[] {
    const authConfig = environment.awsConfig.auth;
    const candidates = [
      authConfig.redirectSignInNative,
      authConfig.redirectSignOutNative,
      authConfig.redirectSignInWeb,
      authConfig.redirectSignOutWeb
    ];

    return candidates
      .map((candidate) => {
        try {
          const parsed = candidate ? new URL(candidate) : null;
          return parsed?.protocol === 'https:' ? parsed.host : null;
        } catch {
          return null;
        }
      })
      .filter((host): host is string => Boolean(host));
  }

  private isConfiguredAppLink(parsedUrl: URL): boolean {
    return parsedUrl.protocol === 'https:' && this.appLinkHosts.includes(parsedUrl.host);
  }
}
