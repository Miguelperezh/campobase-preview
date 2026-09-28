// ==========================================================================
// GESTIÓN DEL CUERPO TÉCNICO / STAFF (CampoBase v1)
// Permite a cada club crear su estructura técnica personalizada:
// Primer/Segundo Entrenador, Preparador de Porteros, Preparador Físico,
// Delegados, Fisioterapeutas, Readaptadores o cargos a medida.
// ==========================================================================

import { getAll, getOne, put, remove } from './db.js';
import { compressAndCropImage, wirePhotoCropperField } from './image-crop-utils.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const STAFF_ROLES = [
  { id: 'head_coach', label: 'Primer Entrenador', badge: '1º Entrenador', color: 'blue' },
  { id: 'assistant_coach', label: 'Segundo Entrenador', badge: '2º Entrenador', color: 'indigo' },
  { id: 'goalkeeper_coach', label: 'Preparador de Porteros', badge: 'Prep. Porteros', color: 'emerald' },
  { id: 'fitness_coach', label: 'Preparador Físico', badge: 'Prep. Físico', color: 'teal' },
  { id: 'team_delegate', label: 'Delegado de Equipo', badge: 'Delegado', color: 'amber' },
  { id: 'pitch_delegate', label: 'Delegado de Campo', badge: 'Del. Campo', color: 'amber' },
  { id: 'physio', label: 'Fisioterapeuta / Médico', badge: 'Fisioterapeuta', color: 'rose' },
  { id: 'rehab', label: 'Readaptador Físico', badge: 'Readaptador', color: 'cyan' },
  { id: 'analyst', label: 'Analista Táctico', badge: 'Analista', color: 'violet' },
  { id: 'kitman', label: 'Encargado de Material', badge: 'Material', color: 'slate' },
  { id: 'other', label: 'Otro cargo (personalizado)', badge: 'Staff', color: 'zinc' },
];

export function getRoleMeta(roleId) {
  return STAFF_ROLES.find((r) => r.id === roleId) || {
    id: 'other',
    label: 'Cuerpo Técnico',
    badge: 'Técnico',
    color: 'zinc',
  };
}

export async function getStaffMembers() {
  try {
    const settings = await getAll('settings');
    return settings
      .filter((item) => item?.recordType === 'staffMember')
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
  } catch (err) {
    console.error('Error al obtener cuerpo técnico:', err);
    return [];
  }
}

export async function saveStaffMember(data) {
  if (!data || typeof data !== 'object') {
    throw new TypeError('Los datos del miembro del cuerpo técnico son obligatorios.');
  }

  let id;
  if (data.id !== undefined && data.id !== null && data.id !== '') {
    if (typeof data.id !== 'string' || !data.id.startsWith('staff-')) {
      throw new Error('Identificador no válido: el ID de un miembro del cuerpo técnico debe comenzar obligatoriamente por "staff-".');
    }
    id = data.id;
  } else {
    id = `staff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const roleMeta = getRoleMeta(data.role);
  const record = {
    id,
    recordType: 'staffMember',
    name: (data.name || '').trim(),
    role: data.role || 'head_coach',
    roleTitle: data.role === 'other' ? (data.customRole || 'Técnico').trim() : roleMeta.label,
    badgeText: data.role === 'other' ? (data.customRole || 'Staff').trim() : roleMeta.badge,
    color: roleMeta.color,
    photo: data.photo || '',
    phone: (data.phone || '').trim(),
    email: (data.email || '').trim(),
    notes: (data.notes || '').trim(),
    order: data.order ?? 99,
    createdAt: data.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  if (!record.name) throw new Error('El nombre del miembro del cuerpo técnico es obligatorio.');
  await put('settings', record);
  return record;
}

export async function deleteStaffMember(id) {
  if (typeof id !== 'string' || !id.startsWith('staff-')) {
    throw new Error('Identificador no válido: solo se pueden eliminar registros cuyo ID comience por "staff-".');
  }
  await remove('settings', id);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function staffAvatarHtml(member) {
  if (member.photo && member.photo.startsWith('data:image/')) {
    return `<img class="staff-avatar-img" src="${escapeHtml(member.photo)}" alt="Foto de ${escapeHtml(member.name)}">`;
  }
  const initials = (member.name || 'CT')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return `<div class="staff-avatar-initials staff-role-${member.color || 'zinc'}">${escapeHtml(initials)}</div>`;
}

export function renderStaffList(members, container) {
  if (!container) return;

  if (!members || members.length === 0) {
    container.innerHTML = `
      <div class="staff-empty-card panel">
        <div class="staff-empty-icon">📋</div>
        <h3>Sin perfiles en el cuerpo técnico</h3>
        <p class="meta">Cada equipo tiene su propia estructura: solo entrenadores, o también preparadores de porteros, físicos, delegados y readaptadores. Configura tu staff a tu medida.</p>
        <button type="button" class="primary compact" id="add-first-staff-btn">
          + Añadir primer técnico
        </button>
      </div>
    `;
    container.querySelector('#add-first-staff-btn')?.addEventListener('click', () => openStaffDialog());
    return;
  }

  container.innerHTML = `
    <div class="staff-grid">
      ${members.map((member) => {
        const phoneFormatted = member.phone ? escapeHtml(member.phone) : '';
        const whatsappUrl = member.phone
          ? `https://wa.me/${encodeURIComponent(member.phone.replace(/[^0-9]/g, ''))}`
          : '';

        return `
          <article class="card staff-card" data-staff-id="${member.id}">
            <div class="staff-card-header">
              <div class="staff-avatar-wrapper">
                ${staffAvatarHtml(member)}
                <span class="staff-badge staff-role-${member.color || 'zinc'}">
                  ${escapeHtml(member.badgeText || member.roleTitle)}
                </span>
              </div>
              <div class="staff-info">
                <h3 class="staff-name">${escapeHtml(member.name)}</h3>
                <p class="staff-role-title">${escapeHtml(member.roleTitle)}</p>
              </div>
            </div>

            ${member.phone || member.notes ? `
              <div class="staff-card-body">
                ${member.phone ? `
                  <div class="staff-contact-row">
                    <span class="staff-contact-label">📞 Teléfono:</span>
                    <a href="tel:${phoneFormatted}" class="staff-phone-link">${phoneFormatted}</a>
                    ${whatsappUrl ? `
                      <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="staff-wa-btn" title="Contactar por WhatsApp">
                        WhatsApp
                      </a>
                    ` : ''}
                  </div>
                ` : ''}
                ${member.notes ? `
                  <p class="staff-notes">${escapeHtml(member.notes)}</p>
                ` : ''}
              </div>
            ` : ''}

            <div class="staff-card-actions">
              <button type="button" class="secondary compact edit-staff-btn" data-id="${member.id}">
                ✏️ Editar
              </button>
              <button type="button" class="ghost-danger compact delete-staff-btn" data-id="${member.id}">
                🗑️ Eliminar
              </button>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.edit-staff-btn').forEach((btn) => {
    btn.addEventListener('click', () => openStaffDialog(btn.dataset.id));
  });

async function confirmStaffAction(title, message) {
  const dialog = document.querySelector('#confirmation-dialog');
  if (!dialog) return true;
  const titleEl = document.querySelector('#confirmation-title');
  const msgEl = document.querySelector('#confirmation-message');
  const acceptEl = document.querySelector('#confirmation-accept');
  const cancelEl = document.querySelector('#confirmation-cancel');
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (acceptEl) {
    acceptEl.textContent = 'Eliminar';
    acceptEl.className = 'danger';
  }
  return new Promise((resolve) => {
    const finish = (result) => {
      acceptEl?.removeEventListener('click', onAccept);
      cancelEl?.removeEventListener('click', onCancel);
      dialog.removeEventListener('cancel', onCancel);
      dialog.close();
      resolve(result);
    };
    const onAccept = () => finish(true);
    const onCancel = (e) => { e?.preventDefault(); finish(false); };
    acceptEl?.addEventListener('click', onAccept);
    cancelEl?.addEventListener('click', onCancel);
    dialog.addEventListener('cancel', onCancel);
    dialog.showModal();
  });
}

  container.querySelectorAll('.delete-staff-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const member = members.find((m) => m.id === id);
      const ok = await confirmStaffAction('Eliminar perfil técnico', `¿Deseas eliminar a ${member?.name || 'este técnico'} del cuerpo técnico?`);
      if (!ok) return;
      await deleteStaffMember(id);
      await refreshStaffView();
    });
  });
}

export function renderPlantillaStaffTop(members, container) {
  if (!container) return;

  if (!members || members.length === 0) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="plantilla-staff-bar">
      <div class="plantilla-staff-head">
        <div class="plantilla-staff-title-wrap">
          <span class="plantilla-staff-icon">📋</span>
          <h3 class="plantilla-staff-title">Cuerpo Técnico</h3>
          <span class="plantilla-staff-count-pill">${members.length}</span>
        </div>
        <button type="button" class="secondary compact" id="plantilla-staff-add-btn">+ Añadir técnico</button>
      </div>
      <div class="plantilla-staff-scroll">
        ${members.map((member) => {
          const phoneClean = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
          const waUrl = phoneClean ? `https://wa.me/${encodeURIComponent(phoneClean)}` : '';
          const telUrl = member.phone ? `tel:${escapeHtml(member.phone)}` : '';

          return `
            <div class="plantilla-staff-card" data-staff-id="${member.id}">
              <div class="plantilla-staff-avatar-box">
                ${staffAvatarHtml(member)}
              </div>
              <div class="plantilla-staff-info">
                <span class="plantilla-staff-role-badge staff-role-${member.color || 'zinc'}">
                  ${escapeHtml(member.badgeText || member.roleTitle)}
                </span>
                <strong class="plantilla-staff-name">${escapeHtml(member.name)}</strong>
              </div>
              <div class="plantilla-staff-actions">
                ${waUrl ? `<a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="staff-quick-btn wa" title="WhatsApp a ${escapeHtml(member.name)}">💬</a>` : ''}
                ${telUrl ? `<a href="${telUrl}" class="staff-quick-btn tel" title="Llamar a ${escapeHtml(member.name)}">📞</a>` : ''}
                <button type="button" class="staff-quick-btn edit plantilla-staff-edit-btn" data-id="${member.id}" title="Editar perfil">✏️</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelector('#plantilla-staff-add-btn')?.addEventListener('click', () => openStaffDialog());
  container.querySelectorAll('.plantilla-staff-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => openStaffDialog(btn.dataset.id));
  });
}

export async function refreshPlantillaStaff() {
  const container = $('#plantilla-staff-top');
  if (!container) return;
  const members = await getStaffMembers();
  renderPlantillaStaffTop(members, container);
}

export async function refreshStaffView() {
  const container = $('#staff-list-container');
  const countBadge = $('#staff-total-count');

  const members = await getStaffMembers();
  if (countBadge) {
    countBadge.textContent = `${members.length} ${members.length === 1 ? 'miembro' : 'miembros'}`;
  }
  if (container) {
    renderStaffList(members, container);
  }
  await refreshPlantillaStaff();
}

let staffCropper = null;

export async function openStaffDialog(staffId = null) {
  const dialog = $('#staff-dialog');
  const form = $('#staff-form');
  if (!dialog || !form) return;

  form.reset();
  const idInput = form.querySelector('[name="id"]');
  const preview = $('#staff-photo-preview');
  const photoHidden = form.querySelector('[name="existingPhoto"]');
  const roleSelect = form.querySelector('[name="role"]');
  const customRoleGroup = $('#staff-custom-role-group');

  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  if (photoHidden) photoHidden.value = '';

  if (staffId) {
    const member = await getOne('settings', staffId);
    if (member) {
      if (idInput) idInput.value = member.id;
      form.querySelector('[name="name"]').value = member.name || '';
      if (roleSelect) roleSelect.value = member.role || 'head_coach';
      form.querySelector('[name="phone"]').value = member.phone || '';
      form.querySelector('[name="notes"]').value = member.notes || '';
      if (photoHidden && member.photo) {
        photoHidden.value = member.photo;
        if (preview) {
          preview.src = member.photo;
          preview.classList.remove('hidden');
        }
      }
      staffCropper?.setExistingPhoto(member.photo || '');
      if (customRoleGroup) {
        customRoleGroup.classList.toggle('hidden', member.role !== 'other');
        form.querySelector('[name="customRole"]').value = member.role === 'other' ? (member.roleTitle || '') : '';
      }
    }
  } else {
    if (idInput) idInput.value = '';
    staffCropper?.setExistingPhoto('');
    if (customRoleGroup) customRoleGroup.classList.add('hidden');
  }

  dialog.showModal();
}

export function initStaffManagement() {
  const addBtn = $('#new-staff-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => openStaffDialog());
  }

  const dialog = $('#staff-dialog');
  const form = $('#staff-form');
  if (!dialog || !form) return;

  const roleSelect = form.querySelector('[name="role"]');
  const customRoleGroup = $('#staff-custom-role-group');
  if (roleSelect && customRoleGroup) {
    roleSelect.addEventListener('change', () => {
      customRoleGroup.classList.toggle('hidden', roleSelect.value !== 'other');
      if (roleSelect.value === 'other') {
        form.querySelector('[name="customRole"]')?.focus();
      }
    });
  }

  const fileInput = form.querySelector('[name="photoFile"]');
  const preview = $('#staff-photo-preview');
  const placeholder = $('#staff-photo-placeholder');
  const removePhotoBtn = $('#staff-remove-photo-btn');
  const photoHidden = form.querySelector('[name="existingPhoto"]');
  const controlsGroup = $('#staff-photo-controls');
  const cropUpBtn = $('#staff-crop-up-btn');
  const cropDownBtn = $('#staff-crop-down-btn');

  staffCropper = wirePhotoCropperField({
    fileInput,
    previewImg: preview,
    placeholder,
    existingInput: photoHidden,
    controlsGroup,
    cropUpBtn,
    cropDownBtn,
    removeBtn: removePhotoBtn,
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {
      id: formData.get('id') || undefined,
      name: formData.get('name'),
      role: formData.get('role'),
      customRole: formData.get('customRole'),
      phone: formData.get('phone'),
      notes: formData.get('notes'),
      photo: formData.get('existingPhoto') || '',
    };

    try {
      await saveStaffMember(data);
      dialog.close();
      form.reset();
      staffCropper?.setExistingPhoto('');
      await refreshStaffView();
    } catch (err) {
      alert(err.message || 'Error al guardar el perfil.');
    }
  });

  dialog.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => dialog.close());
  });

  // Render inicial
  refreshStaffView();
}
