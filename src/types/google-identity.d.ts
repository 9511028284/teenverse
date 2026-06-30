export {};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
            use_fedcm_for_button?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options?: {
              theme?: string;
              size?: string;
              type?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}
