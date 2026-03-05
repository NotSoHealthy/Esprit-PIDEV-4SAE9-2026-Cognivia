<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=(social.displayInfo!false) displayMessage=true displayRequiredFields=false bodyClass="register-page"; section>
    <#if (section!"") = "header">
        <#-- Title moved into form -->
    <#elseif (section!"") = "form">
        <h1 id="kc-page-title">${msg("customCreateProfile")}</h1>

        <form id="kc-register-form" action="${url.registrationAction}" method="post">
            <div class="form-group">
                <input type="text" id="firstName" name="firstName" value="${(register.formData.firstName!'')}"
                       placeholder="${msg("customFirstName")}" autocomplete="given-name" />
            </div>

            <div class="form-group">
                <input type="text" id="lastName" name="lastName" value="${(register.formData.lastName!'')}"
                       placeholder="${msg("customLastName")}" autocomplete="family-name" />
            </div>

            <div class="form-group">
                <input type="text" id="email" name="email" value="${(register.formData.email!'')}"
                       placeholder="${msg("customEmail")}" autocomplete="email" />
            </div>

            <#if passwordRequired??>
                <div class="form-group">
                    <input type="password" id="password" name="password"
                           placeholder="${msg("customPassword")}" autocomplete="new-password" />
                </div>

                <div class="form-group">
                    <input type="password" id="password-confirm" name="password-confirm"
                           placeholder="${msg("customConfirmPassword")}" autocomplete="new-password" />
                </div>
            </#if>

            <div class="form-group">
                <input type="tel" id="user.attributes.phoneNumber" name="user.attributes.phoneNumber" value="${(register.formData['user.attributes.phoneNumber']!'')}"
                       placeholder="${msg("customPhone")}" autocomplete="tel" />
            </div>

            <div class="form-group">
                <select id="user.attributes.role" name="user.attributes.role" class="kc-select">
                    <option value="" disabled <#if !(register.formData['user.attributes.role']?has_content)>selected</#if>>${msg("customRole")}</option>
                    <option value="doctor" <#if (register.formData['user.attributes.role']!'') == 'doctor'>selected</#if>>${msg("customRoleDoctor")}</option>
                    <option value="caregiver" <#if (register.formData['user.attributes.role']!'') == 'caregiver'>selected</#if>>${msg("customRoleCaregiver")}</option>
                    <option value="patient" <#if (register.formData['user.attributes.role']!'') == 'patient'>selected</#if>>${msg("customRolePatient")}</option>
                </select>
            </div>

            <div class="form-group">
                <input class="btn-primary" type="submit" value="${msg("customSignUp")}" />
            </div>
        </form>

        <#if realm.password && social.providers?? && social.providers?has_content>
            <div id="kc-social-providers">
                <div class="separator">OR</div>
                <div class="registration-social-label">${msg("customConnectWith")}</div>
                <ul>
                    <#list social.providers as p>
                        <li>
                            <a href="${p.loginUrl}" id="zocial-${p.alias}" class="zocial ${p.alias}">
                                <#if p.alias == "google">
                                    <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google">
                                    <span>Google</span>
                                <#elseif p.alias == "facebook">
                                    <img src="https://www.vectorlogo.zone/logos/facebook/facebook-official.svg" alt="Facebook">
                                    <span>Facebook</span>
                                <#else>
                                    <span>${p.displayName!}</span>
                                </#if>
                            </a>
                        </li>
                    </#list>
                </ul>
            </div>
        </#if>

        <div class="registration-footer">
            ${msg("customTerms")} <a href="#">${msg("customTermsLink")}</a> ${msg("customAnd")} <a href="#">${msg("customPrivacy")}</a>
        </div>
    </#if>
</@layout.registrationLayout>
