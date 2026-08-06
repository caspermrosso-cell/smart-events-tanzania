/// <reference types="vite/client" />

declare module '*.asset.json' {
  const value: {
    version: number;
    asset_id: string;
    project_id: string;
    url: string;
    r2_key: string;
    original_filename: string;
    size: number;
    content_type: string;
    created_at: string;
  };
  export default value;
}

