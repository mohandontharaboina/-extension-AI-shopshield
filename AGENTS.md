<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render the shared brand shield using a lazily loaded, client-mounted React Three Fiber canvas with an icon fallback; this keeps SSR and existing navigation functional when WebGL is unavailable.
- Keep shield material colors in semantic global CSS tokens and honor reduced-motion preferences; this preserves theming and accessibility independently of brand values.
