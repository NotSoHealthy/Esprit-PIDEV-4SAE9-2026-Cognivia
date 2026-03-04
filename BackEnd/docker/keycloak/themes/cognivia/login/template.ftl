<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false showAnotherWayIfPresent=true>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
</head>

<body class="${properties.kcBodyClass!}">
    <header class="cognivia-header">
        <a href="http://localhost:4200" class="header-logo">
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fd3d69403f729419ab22b58accb7875b9%2F9db03c941d394af5b6ff65a035e69fd5?format=webp&width=800&height=1200" alt="Cognivia Logo" class="logo-img">
            <span class="logo-text">cognivia</span>
        </a>
        
        <div class="header-right">
            <#-- Interactive Language Dropdown -->
            <div class="header-lang" id="kc-lang-toggle">
                <span>${msg("customSiteLanguage")}: <span id="current-lang-text">${(locale.current)!'English'}</span></span>
                <svg class="lang-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 9l-7 7-7-7"></path>
                </svg>
                <div class="lang-dropdown" id="kc-lang-dropdown">
                    <#if realm.internationalizationEnabled && (locale.supported)?? && locale.supported?size gt 1>
                        <#list locale.supported as l>
                            <a href="${l.url}" class="lang-item" data-locale="${l.label}">${l.label}</a>
                        </#list>
                    <#else>
                        <#-- Fallback if Keycloak internationalization is disabled -->
                        <a href="#" class="lang-item" data-locale="en">English</a>
                        <a href="#" class="lang-item" data-locale="fr">Français</a>
                        <a href="#" class="lang-item" data-locale="ar">Arabic</a>
                    </#if>
                </div>
            </div>
        </div>

        <script>
            document.addEventListener('DOMContentLoaded', function() {
                var toggle = document.getElementById('kc-lang-toggle');
                var dropdown = document.getElementById('kc-lang-dropdown');
                
                toggle.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var isVisible = dropdown.style.display === 'block';
                    dropdown.style.display = isVisible ? 'none' : 'block';
                });

                document.addEventListener('click', function() {
                    dropdown.style.display = 'none';
                });

                // Handle language switch without breaking the OIDC flow (fixes 400 error)
                var langItems = document.querySelectorAll('.lang-item');
                langItems.forEach(function(item) {
                    item.addEventListener('click', function(e) {
                        var href = this.getAttribute('href');
                        if (href === '#') {
                            e.preventDefault();
                            var locale = this.getAttribute('data-locale').toLowerCase().substring(0, 2);
                            var url = new URL(window.location.href);
                            url.searchParams.set('kc_locale', locale);
                            window.location.href = url.toString();
                        } else {
                            // Keycloak generated URL is usually safe, but check if we need to manually fix it
                            try {
                                var url = new URL(href, window.location.origin);
                                // Ensure we keep the original search params from the current page
                                var currentParams = new URLSearchParams(window.location.search);
                                currentParams.forEach((value, key) => {
                                    if (key !== 'kc_locale') url.searchParams.set(key, value);
                                });
                                this.setAttribute('href', url.toString());
                            } catch(err) {}
                        }
                    });
                });
                // Sync the displayed language with the URL parameter
                var urlParams = new URLSearchParams(window.location.search);
                var currentLocale = urlParams.get('ui_locales') || urlParams.get('kc_locale');
                if (currentLocale) {
                    var localeMap = {
                        'en': 'English',
                        'fr': 'Français',
                        'ar': 'Arabic'
                    };
                    var langName = localeMap[currentLocale.toLowerCase().substring(0, 2)];
                    if (langName) {
                        document.getElementById('current-lang-text').textContent = langName;
                    }
                }
            });
        </script>
    </header>

    <div id="kc-container">
        <div id="kc-container-wrapper">
            <div class="top-nav-container">
                <#if (pageId!"") = "register">
                    <a href="${url.loginUrl}" class="btn-header-outline">${msg("customSignIn")}</a>
                <#elseif (pageId!"") = "login">
                    <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
                        <a href="${url.registrationUrl}" class="btn-header-outline">${msg("customSignUp")}</a>
                    </#if>
                </#if>
            </div>
            <div id="kc-content">
                <div id="kc-content-wrapper">

                    <#if displayMessage && message?has_content && (message.type != 'warning' || !((isAppInitiatedAction)??))>
                        <div class="alert-${message.type} ${properties.kcAlertClass!}">
                            <span class="kc-feedback-text">${kcSanitize(message.summary)?no_esc}</span>
                        </div>
                    </#if>

                    <#nested "header">
                    <#nested "form">
                    <#nested "info">
                </div>
            </div>
        </div>
    </div>
</body>
</html>
</#macro>
