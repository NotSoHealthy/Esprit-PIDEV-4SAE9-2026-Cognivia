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
        <div class="header-lang">
            <span>Site Language: English</span>
            <svg class="lang-arrow" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="#6E7580" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
    </header>

    <div id="kc-container">
        <div id="kc-container-wrapper">
            <div id="kc-content">
                <div id="kc-content-wrapper">

                    <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
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
