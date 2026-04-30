# AGENTS

## Projectconventies

- Dit project is de bron voor het WD Infra WordPress-thema.
- Bij iedere relevante wijziging aan de website of het thema moet de actuele build ook worden verwerkt naar:
  `C:\Users\jonat\OneDrive\Bureaublad\wd-2\wp-thema\wd-infra`
- Daarna moet de upload-zip opnieuw worden gemaakt in:
  `C:\Users\jonat\OneDrive\Bureaublad\wd-2\wp-thema\wd-infra.zip`
- Iedere gepubliceerde themaversie moet ook als versie-zip worden bewaard in:
  `C:\Users\jonat\OneDrive\Bureaublad\wd-2\wp-thema\wd-infra-v{version}.zip`
  waarbij `{version}` overeenkomt met de `Version:` waarde in `wp-thema\wd-infra\style.css`.
- De Local-site `wd-infra.local` is de standaard preview-omgeving voor dit project.
- Na iedere relevante wijziging moet het thema ook lokaal worden gepubliceerd naar:
  `C:\Users\jonat\Local Sites\wd-infra\app\public\wp-content\themes\wd-infra`
- Na publicatie moet het theme `wd-infra` worden geactiveerd op de Local-site `wd-infra.local`, tenzij de gebruiker expliciet aangeeft dat niet te willen.
- Gebruik hiervoor het script:
  `C:\Users\jonat\OneDrive\Bureaublad\wd-2\scripts\publish-local.ps1`

## Publish-doel

- Bronproject:
  `C:\Users\jonat\OneDrive\Bureaublad\wd-2`
- Theme bronmap:
  `C:\Users\jonat\OneDrive\Bureaublad\wd-2\wp-thema\wd-infra`
- Local WordPress doelmap:
  `C:\Users\jonat\Local Sites\wd-infra\app\public\wp-content\themes\wd-infra`

## Opmerking

- De publish is een lokale sync voor preview en testen in WordPress Local.
- Bestaande WordPress core themes zoals `hello-biz` en `twentytwenty*` mogen niet aangepast of overschreven worden.
