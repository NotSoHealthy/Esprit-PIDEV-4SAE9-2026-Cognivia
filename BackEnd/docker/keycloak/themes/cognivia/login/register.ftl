<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=social.displayInfo; section>
    <#if section = "title">
        ${msg("registerTitle")}
    <#elseif section = "header">
        <h1 id="kc-page-title">${msg("registerTitle")}</h1>
    <#elseif section = "form">
        <form id="kc-register-form" action="${url.registrationAction}" method="post">
            <div class="form-group">
                <input type="text" id="user.attributes.age" name="user.attributes.age" 
                       value="${(register.formData['user.attributes.age']!'')}"
                       placeholder="Âge" class="form-control" />
            </div>

            <div class="form-group">
                <input type="text" id="firstName" name="firstName" 
                       value="${(register.formData.firstName!'')}"
                       placeholder="Prénom / Nom (facultatif)" class="form-control" />
            </div>

            <div class="form-group">
                <input type="text" id="email" name="email" 
                       value="${(register.formData.email!'')}"
                       autocomplete="email" placeholder="Adresse e-mail" class="form-control" 
                       aria-invalid="<#if messagesPerField.existsError('email')>true</#if>"/>
                <#if messagesPerField.existsError('email')>
                    <span id="input-error-email" class="instruction-error" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('email'))?no_esc}
                    </span>
                </#if>
            </div>

            <#if !realm.registrationEmailAsUsername>
                <div class="form-group">
                    <input type="text" id="username" name="username" 
                           value="${(register.formData.username!'')}"
                           autocomplete="username" placeholder="${msg("username")}" class="form-control"
                           aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"/>
                    <#if messagesPerField.existsError('username')>
                        <span id="input-error-username" class="instruction-error" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('username'))?no_esc}
                        </span>
                    </#if>
                </div>
            </#if>

            <div class="form-group">
                <input type="password" id="password" name="password" 
                       autocomplete="new-password" placeholder="Mot de passe" class="form-control"
                       aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"/>
                <#if messagesPerField.existsError('password')>
                    <span id="input-error-password" class="instruction-error" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('password'))?no_esc}
                    </span>
                </#if>
            </div>

            <div class="form-group">
                <input type="password" id="password-confirm" name="password-confirm" 
                       placeholder="Confirmer le mot de passe" class="form-control"
                       aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"/>
                <#if messagesPerField.existsError('password-confirm')>
                    <span id="input-error-password-confirm" class="instruction-error" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                    </span>
                </#if>
            </div>

            <div class="form-group">
                <input class="btn-primary" type="submit" value="Créer un compte" />
            </div>
        </form>
    <#elseif section = "info" >
        <div id="kc-registration">
            <span>Déjà inscrit? <a href="${url.loginUrl}">${msg("doLogIn")}</a></span>
        </div>
    </#if>
</@layout.registrationLayout>
