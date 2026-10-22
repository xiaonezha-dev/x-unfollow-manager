/* X Unfollow Manager - popup logic (original implementation) */
(function () {
  'use strict';

  const I18N = {
    zh: {
      tabNonfb: '正在关注', tabWhite: '白名单', tabSettings: '设置',
      pageHint: '请先在 X 打开你自己的「正在关注 / 粉丝」页面（x.com/你的用户名/following 或 /followers），再点扫描。',
      scanFollowing: '扫描「正在关注」', scanFollowers: '扫描「粉丝」', resumeScan: '继续扫描', computeNonFb: '生成关注名单',
      speedFast: '🚀 快速', speedNormal: '🚶 普通', speedSafe: '🛡️ 安全',
      startUnfollow: '开始取关选中', stop: '停止',
      selAll: '全选', selNone: '全不选',
      statusIdle: '就绪。',
      statusScanning: (k, n) => `正在扫描${k === 'following' ? '正在关注' : '粉丝'}列表…已抓取 ${n}`,
      statusScanDone: (k, n) => `${k === 'following' ? '正在关注' : '粉丝'}扫描完成，共 ${n} 个`,
      statusScanPartial: (k, n) => `${k === 'following' ? '正在关注' : '粉丝'}已抓取 ${n} 个（X 限流中断，稍后点「继续扫描」接着扫）`,
      statusUnfollowing: (d, t) => `取关中… ${d}/${t}`,
      unfollowResting: (s) => `休息中，约 ${s} 秒后继续下一个`,
      statusUnfollowDone: (d) => `取关完成，共 ${d} 个`,
      statusUnfollowFailed: (f) => `（${f} 个未处理：已取关或不在列表中）`,
      statusSkipped: (s) => ` · 跳过 ${s} 个（已拉黑、已取关或不存在）`,
      statusStopped: '已停止。', statusCapped: '已达今日上限，明天再来。',
      needBoth: '请先扫描「正在关注」和「粉丝」两个列表。',
      needScanFirst: '请先拉取粉丝名单（一键分析或下方页面扫描）。',
      whiteHint: '白名单里的账号永远不会被批量取关误伤。每行一个 handle，可带 @。',
      whiteSave: '保存白名单', whiteSaved: (n) => `已保存 ${n} 个白名单账号`,
      lblCap: '每日取关上限', capSave: '保存设置', capSaved: '设置已保存',
      disclaimer: '注意：X 对高频操作有限流甚至封号风险。请用「安全」速度、遵守每日上限。批量取关是你自己的操作，后果自负。',
      badgeVerified: '已验证', badgeBot: '疑似僵尸',
      errNoX: '当前标签页不是 X，请打开 x.com 后重试。',
      errNoContent: '内容脚本未就绪，请刷新 X 页面后重试。',
      tabCleanup: '粉丝',
      cleanupHint: '一键分析拉取粉丝名单后，用上方条件筛选，点「开始清理」逐个软拉黑移除。Pro 功能，操作时会逐个跳转主页，请勿手动切换页面。',
      computeNonBlue: '生成粉丝名单', startCleanup: '软拉黑',
      cleanupStatusIdle: '就绪。',
      cleanupRunning: (d, t) => `清理中… ${d}/${t}`,
      cleanupResting: (s) => `批次休息中，约 ${s} 秒后继续`,
      cleanupDone: (d) => `清理完成，共移除 ${d} 个`,
      cleanupFailed: (f) => `（${f} 个未完成，可能仍处于屏蔽状态，请检查）`,
      proTitle: 'Pro 订阅',
      proFree: '当前：免费版（每日取关上限 20，无快速模式，不含粉丝清理）',
      proActive: (exp) => `当前：Pro，有效期至 ${new Date(exp).toLocaleDateString()}`,
      keyPh: '输入 Pro 授权码', activate: '激活', buyPro: '购买 Pro — $9.9/年',
      serverUrlPh: '授权服务器地址，如 https://license.example.com', saveServer: '保存',
      serverSaved: '已保存', needPro: '这是 Pro 功能，请先在「设置」页激活授权码。',
      needServer: '请先填写授权服务器地址（自测可用自带的示例服务器）。',
      activeOk: '激活成功，欢迎使用 Pro。',
      activeFail: (r) => '激活失败：' + r,
      offlineOk: '离线宽限期内，Pro 保持有效。',
      bindHint: '在 X 页面打开时激活可将授权码绑定到当前账号',
      bindMismatch: (h) => `此授权码已绑定账号 @${h}，不能用于当前账号`,
      bindMismatchGeneric: '此授权码已绑定其他账号，不能用于当前账号',
      freeCapNote: '免费版每日最多取关 20 个，升级 Pro 可调上限。',
      importList: '导入名单', clearImport: '清除名单',
      importInvalid: '名单格式不对',
      importLoaded: (n) => `名单已导入：${n} 个账号，生成列表后自动勾选命中者`,
      importHits: (n) => `名单命中 ${n} 人，已自动勾选`,
      importKindMismatch: '注意：名单类型与本页不对应。',
      importCleared: '名单已清除',
      apiFetch: '⚡ 一键分析我的账号',
      apiRunning: (k, d, n) => `服务器正在拉取${k === 'following' ? '关注' : '粉丝'}名单… ${d}/${n || '?'}`,
      apiDoneMsg: (f, fo) => `一键分析完成：关注 ${f} 人、粉丝 ${fo} 人，名单已自动生成`,
      apiNeedPro: '一键分析是 Pro 功能：先到「设置」页粘贴授权码激活',
      apiNoHandle: '没认出你的账号：先在 X 打开你自己的任意页面，再点一键分析',
      apiFailed: (m) => '一键分析失败：' + m,
      segLine: (name, n) => `当前分段：${name} · 显示 ${n} 个账号`,
      progressText: (d, n) => `已处理 ${d} / ${n}`,
      confirmSegUnfollow: (n) => `没有勾选任何账号。将对当前分段的 ${n} 个账号全部取关，继续？`,
      confirmSegCleanup: (n) => `没有勾选任何账号。将对当前分段的 ${n} 个账号全部软拉黑移除，继续？`,
      segNames: { all: '全部', nonfollowback: '未回关', inactive: '不活跃', newbie: '新手', influencer: '影响者', quality: '高质量', overactive: '过度活跃', lurker: '潜水号', egg: '默认头像', nobio: '无简介', bot: '疑似机器人', verified: '已验证' },
      segDescs: { all: '本次拉取到的全部账号。', nonfollowback: '你关注了对方，但对方没有回关你的账号。', inactive: '长期未发推或发推频率极低的账号。', newbie: '注册不到 90 天的新账号。', influencer: '粉丝数不少于 10,000 的账号。', quality: '已认证，或粉丝与内容指标健康的高质量账号。', overactive: '日均发推不少于 15 条的账号。', lurker: '注册超过一年但推文极少的账号。', egg: '仍在使用默认头像的账号。', nobio: '没有填写个人简介的账号。' },
      fallbackTools: '兜底工具：页面扫描 / 导入名单'
    },
    en: {
      tabNonfb: 'Following', tabWhite: 'Whitelist', tabSettings: 'Settings',
      pageHint: 'Open your own Following / Followers page on X first (x.com/your_handle/following or /followers), then hit scan.',
      scanFollowing: 'Scan Following', scanFollowers: 'Scan Followers', resumeScan: 'Resume scan', computeNonFb: 'Build following list',
      speedFast: '🚀 Fast', speedNormal: '🚶 Normal', speedSafe: '🛡️ Safe',
      startUnfollow: 'Unfollow selected', stop: 'Stop',
      selAll: 'Select all', selNone: 'Select none',
      statusIdle: 'Ready.',
      statusScanning: (k, n) => `Scanning ${k} list… ${n} collected`,
      statusScanDone: (k, n) => `${k} scan done: ${n} accounts`,
      statusScanPartial: (k, n) => `${k} list: ${n} collected (paused by X rate limit — resume later)`,
      statusUnfollowing: (d, t) => `Unfollowing… ${d}/${t}`,
      unfollowResting: (s) => `Resting, next in ~${s}s`,
      statusUnfollowDone: (d) => `Done, unfollowed ${d}`,
      statusUnfollowFailed: (f) => ` (${f} not processed: already unfollowed or not in the list)`,
      statusSkipped: (s) => ` · skipped ${s} (blocked, already unfollowed, or unavailable)`,
      statusStopped: 'Stopped.', statusCapped: 'Daily limit reached. Come back tomorrow.',
      needBoth: 'Please scan both Following and Followers lists first.',
      needScanFirst: 'Pull your follower list first (one-click analysis or the page scan below).',
      whiteHint: 'Whitelisted accounts are never bulk-unfollowed. One handle per line, @ optional.',
      whiteSave: 'Save whitelist', whiteSaved: (n) => `Saved ${n} whitelisted accounts`,
      lblCap: 'Daily unfollow cap', capSave: 'Save', capSaved: 'Settings saved',
      disclaimer: 'Heads up: X rate-limits aggressive actions and may restrict accounts. Use Safe speed and respect the daily cap. Bulk unfollowing is your own action and your own risk.',
      badgeVerified: 'Verified', badgeBot: 'Suspicious',
      errNoX: 'Active tab is not X. Open x.com and try again.',
      errNoContent: 'Content script not ready. Refresh the X page and try again.',
      tabCleanup: 'Followers',
      cleanupHint: 'After one-click analysis pulls your followers, filter with the options above and hit Remove to soft-block them one by one. Pro feature — it navigates profile by profile, do not switch pages manually.',
      computeNonBlue: 'Build follower list', startCleanup: 'Soft-block remove',
      cleanupStatusIdle: 'Ready.',
      cleanupRunning: (d, t) => `Removing… ${d}/${t}`,
      cleanupResting: (s) => `Batch rest, resuming in ~${s}s`,
      cleanupDone: (d) => `Done, removed ${d}`,
      cleanupFailed: (f) => ` (${f} not completed — may still be blocked, please check)`,
      proTitle: 'Pro subscription',
      proFree: 'Current: Free (20 unfollows/day, no fast mode, no follower cleanup)',
      proActive: (exp) => `Current: Pro, valid until ${new Date(exp).toLocaleDateString()}`,
      keyPh: 'Enter Pro license key', activate: 'Activate', buyPro: 'Get Pro — $9.9/year',
      serverUrlPh: 'License server URL, e.g. https://license.example.com', saveServer: 'Save',
      serverSaved: 'Saved', needPro: 'This is a Pro feature. Activate a license key in Settings first.',
      needServer: 'Enter your license server URL first (use the bundled example server for testing).',
      activeOk: 'Activated. Welcome to Pro.',
      activeFail: (r) => 'Activation failed: ' + r,
      offlineOk: 'Within offline grace period — Pro stays active.',
      bindHint: 'Activate while an X page is open to bind the license key to the current account',
      bindMismatch: (h) => `This license key is already bound to @${h} and cannot be used with the current account`,
      bindMismatchGeneric: 'This license key is already bound to another account and cannot be used with the current account',
      freeCapNote: 'Free tier caps at 20 unfollows/day. Upgrade to Pro for more.',
      importList: 'Import list', clearImport: 'Clear list',
      importInvalid: 'Invalid list file',
      importLoaded: (n) => `List imported: ${n} handles — matches auto-select when you build the list`,
      importHits: (n) => `${n} list matches auto-selected`,
      importKindMismatch: 'Note: list kind does not match this tab.',
      importCleared: 'List cleared',
      apiFetch: '⚡ Analyze my account',
      apiRunning: (k, d, n) => `Server is pulling your ${k} list… ${d}/${n || '?'}`,
      apiDoneMsg: (f, fo) => `Analysis done: ${f} following, ${fo} followers — lists are ready`,
      apiNeedPro: 'One-click analysis is a Pro feature: activate a license key in Settings first',
      apiNoHandle: 'Could not detect your account: open any of your own X pages first, then retry',
      apiFailed: (m) => 'Analysis failed: ' + m,
      segLine: (name, n) => `Segment: ${name} · ${n} accounts shown`,
      progressText: (d, n) => `Processed ${d} / ${n}`,
      confirmSegUnfollow: (n) => `No accounts are checked. Unfollow ALL ${n} accounts in the current segment?`,
      confirmSegCleanup: (n) => `No accounts are checked. Soft-block remove ALL ${n} accounts in the current segment?`,
      segNames: { all: 'All', nonfollowback: 'Not following back', inactive: 'Inactive', newbie: 'Newbies', influencer: 'Influencers', quality: 'High quality', overactive: 'Overactive', lurker: 'Lurkers', egg: 'Default avatar', nobio: 'No bio', bot: 'Likely bots', verified: 'Verified' },
      segDescs: { all: 'Every account fetched in this run.', nonfollowback: 'Accounts you follow that do not follow you back.', inactive: 'Accounts that have not posted for a long time, or post extremely rarely.', newbie: 'Accounts created less than 90 days ago.', influencer: 'Accounts with at least 10,000 followers.', quality: 'Verified accounts, or accounts with healthy follower and content metrics.', overactive: 'Accounts posting at least 15 times per day on average.', lurker: 'Accounts older than a year with very few posts.', egg: 'Accounts still using the default avatar.', nobio: 'Accounts with no profile bio.' },
      fallbackTools: 'Fallback tools: page scan / import list'
    }
  };

  let lang = 'zh';
  /* Gold verified-style seal shown next to the bound X handle in the
   * Pro status line (mirrors X's badge shape, gold instead of blue). */
  const GOLD_BADGE_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align:-3px;margin-left:2px" aria-hidden="true"><path fill="#E3B341" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-4.8 1.42 1.42-6.15 6.28z"/></svg>';
  const t = (k, ...a) => {
    const v = (I18N[lang] && I18N[lang][k]) || I18N.en[k];
    return typeof v === 'function' ? v(...a) : v;
  };

  const $ = (id) => document.getElementById(id);
  async function getS() { const d = await chrome.storage.local.get(['xum']); return d.xum || {}; }
  async function setS(patch) { const s = await getS(); await chrome.storage.local.set({ xum: Object.assign({}, s, patch) }); }

  function normHandle(h) { return (h || '').trim().replace(/^@/, '').toLowerCase(); }

  /* Parse an imported target list (exported by the X Audience Analyzer site).
     Accepts: the JSON export object {app, version, kind, userName, segment,
     handles:[...]}, a bare JSON array of handles, or CSV / plain text with
     one handle per line or comma-separated (@ optional, blanks ignored).
     Returns { ok:true, handles, kind, segment, userName } or { ok:false }.
     Handles are lowercased, validated and deduped. Pure: no DOM/storage. */
  function parseImportedListText(text) {
    const raw = String(text || '').trim();
    if (!raw) return { ok: false };
    let tokens = [];
    let kind = null, segment = '', userName = '';
    if (raw.charAt(0) === '{' || raw.charAt(0) === '[') {
      let data = null;
      try { data = JSON.parse(raw); } catch (e) { return { ok: false }; }
      if (Array.isArray(data)) {
        tokens = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.handles)) {
        tokens = data.handles;
        if (data.kind === 'followers' || data.kind === 'following') kind = data.kind;
        segment = typeof data.segment === 'string' ? data.segment : '';
        userName = typeof data.userName === 'string' ? data.userName.replace(/^@/, '') : '';
      } else {
        return { ok: false };
      }
    } else {
      tokens = raw.split(/[\s,;]+/);
    }
    const seen = new Set();
    const handles = [];
    for (const tok of tokens) {
      const h = normHandle(String(tok == null ? '' : tok));
      if (!/^[a-z0-9_]{1,15}$/.test(h) || seen.has(h)) continue;
      seen.add(h);
      handles.push(h);
    }
    if (!handles.length) return { ok: false };
    return { ok: true, handles, kind, segment, userName };
  }

  /* ---- segment model (1.5.0, mirrors the analyzer website) ----
   * Membership comes from the server analysis (xum.apiSegments) plus
   * one client-side segment computed from stored fields, on the
   * following page: 'nonfollowback' (present in following, absent
   * from followers). Chip order mirrors the website. */
  const SEGMENT_ORDER_FOLLOWING = ['nonfollowback', 'all', 'inactive', 'newbie', 'influencer', 'quality', 'overactive', 'lurker', 'egg', 'nobio'];
  const SEGMENT_ORDER_FOLLOWERS = ['all', 'inactive', 'newbie', 'influencer', 'quality', 'overactive', 'lurker', 'egg', 'nobio'];
  function segName(k) {
    const names = (I18N[lang] && I18N[lang].segNames) || I18N.en.segNames || {};
    return names[k] || k;
  }
  function segDesc(k) {
    const descs = (I18N[lang] && I18N[lang].segDescs) || I18N.en.segDescs || {};
    return descs[k] || '';
  }
  function segUsersOf(cache, seg) {
    if (seg === 'all') return cache.slice();
    return cache.filter((u) => (u.segs || []).includes(seg));
  }
  function checkedTargets(cache) {
    return cache.filter((u) => u.sel).map((u) => u.handle);
  }
  function isBot(u) { return !!((u.apiSegs || []).includes('bot')); }
  function renderChips(containerId, order, cache, selected, onPick) {
    const box = $(containerId);
    if (!box) return;
    box.innerHTML = '';
    for (const key of order) {
      const n = key === 'all' ? cache.length
        : cache.filter((u) => (u.segs || []).includes(key)).length;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (key === selected ? ' on' : '');
      b.dataset.seg = key;
      b.innerHTML = esc(segName(key)) + ' <span class="n">' + n + '</span>';
      b.addEventListener('click', () => onPick(key));
      box.appendChild(b);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseImportedListText, SEGMENT_ORDER_FOLLOWING, SEGMENT_ORDER_FOLLOWERS, segUsersOf };
  }

  async function activeTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }
  async function sendToX(msg) {
    const tab = await activeTab();
    if (!tab || !tab.url || !/^(https:\/\/)(www\.)?(x|twitter)\.com\//.test(tab.url)) {
      throw new Error('nox');
    }
    let pong = null;
    try { pong = await chrome.tabs.sendMessage(tab.id, { action: 'ping' }); } catch (e) { pong = null; }
    if (!pong || !pong.ok) throw new Error('nocontent');
    return chrome.tabs.sendMessage(tab.id, msg);
  }

  function renderTexts() {
    $('tabBtnNonfb').textContent = t('tabNonfb');
    $('tabBtnCleanup').textContent = t('tabCleanup');
    $('tabBtnWhite').textContent = t('tabWhite');
    $('tabBtnSettings').textContent = t('tabSettings');
    $('pageHint').textContent = t('pageHint');
    $('scanFollowing').textContent = t('scanFollowing');
    $('scanFollowers').textContent = t('scanFollowers');
    $('resumeFollowing').textContent = t('resumeScan');
    $('resumeFollowers').textContent = t('resumeScan');
    $('computeNonFb').textContent = t('computeNonFb');
    $('fallbackSummaryF').textContent = t('fallbackTools');
    $('fallbackSummaryC').textContent = t('fallbackTools');
    $('speedSel').options[0].textContent = t('speedFast');
    $('speedSel').options[1].textContent = t('speedNormal');
    $('speedSel').options[2].textContent = t('speedSafe');
    $('startUnfollow').textContent = t('startUnfollow');
    $('stopBtn').textContent = t('stop');
    $('selAll').textContent = t('selAll');
    $('selNone').textContent = t('selNone');
    $('cleanupHint').textContent = t('cleanupHint');
    $('computeNonBlue').textContent = t('computeNonBlue');
    $('startCleanup').textContent = t('startCleanup');
    $('stopCleanupBtn').textContent = t('stop');
    $('selAllC').textContent = t('selAll');
    $('selNoneC').textContent = t('selNone');
    if (!$('cleanupStatus').dataset.touched) $('cleanupStatus').textContent = t('cleanupStatusIdle');
    $('whiteHint').textContent = t('whiteHint');
    $('whiteSave').textContent = t('whiteSave');
    $('lblCap').textContent = t('lblCap');
    $('capSave').textContent = t('capSave');
    $('disclaimer').textContent = t('disclaimer');
    $('proTitle').textContent = t('proTitle');
    $('bindHint').textContent = t('bindHint');
    $('keyInput').placeholder = t('keyPh');
    $('activateBtn').textContent = t('activate');
    $('buyBtn').textContent = t('buyPro');
    $('serverInput').placeholder = t('serverUrlPh');
    $('serverSave').textContent = t('saveServer');
    if (!$('status').dataset.touched) $('status').textContent = t('statusIdle');
    $('importBtn').textContent = t('importList');
    $('clearImport').textContent = t('clearImport');
    $('importBtnC').textContent = t('importList');
    $('clearImportC').textContent = t('clearImport');
    $('apiFetch').textContent = t('apiFetch');
    $('apiFetchC').textContent = t('apiFetch');
    renderImportStatus();
  }

  function setStatus(s) { $('status').textContent = s; $('status').dataset.touched = '1'; }
  function setBar(done, total) {
    $('bar').style.width = total ? Math.round((done / total) * 100) + '%' : '0%';
  }
  function showErr(e) {
    if (e && e.message === 'nox') setStatus(t('errNoX'));
    else if (e && e.message === 'nocontent') setStatus(t('errNoContent'));
    else setStatus(String((e && e.message) || e));
  }

  let followingCache = []; // all following (whitelist excluded): {handle,name,verified,isDefaultAvatar,bio,tweets,followsBack,apiSegs,segs,sel}
  let followersCache = []; // all followers (whitelist excluded): {handle,name,verified,isDefaultAvatar,bio,tweets,apiSegs,segs,sel}
  let selectedSegF = 'nonfollowback'; // following page default chip
  let selectedSegC = 'all';           // followers page default chip
  let importedList = null; // {handles:[], kind, segment, userName, at} from xum.importedList
  let lastApiTaskAt = 0;

  /* Build the following cache from the stored lists. followsBack is
   * derived by set difference against the followers list, so the trait
   * checkboxes can do all further narrowing in the UI. */
  async function buildFollowingCache() {
    const st = await getS();
    const a = st.followingList, b = st.followersList;
    if (!a) { followingCache = []; return false; }
    const followerSet = new Set(((b && b.handles) || []).map((h) => h.toLowerCase()));
    const white = new Set((st.whitelist || []).map((h) => h.toLowerCase()));
    followingCache = a.handles
      .filter((h) => !white.has(h.toLowerCase()))
      .map((h) => {
        const d = (a.detail || {})[h.toLowerCase()] || {};
        const lk = h.toLowerCase();
        const apiSegs = (((st.apiSegments || {}).following) || {})[lk] || [];
        const segs = apiSegs.slice();
        const followsBack = followerSet.has(lk);
        if (!followsBack) segs.push('nonfollowback');
        return {
          handle: h, name: d.name || '', verified: !!d.verified,
          isDefaultAvatar: !!d.isDefaultAvatar, bio: d.bio || '',
          tweets: d.tweets || 0, followsBack, apiSegs, segs, sel: false
        };
      });
    return true;
  }

  async function buildFollowersCache() {
    const st = await getS();
    const b = st.followersList;
    if (!b) { followersCache = []; return false; }
    const white = new Set((st.whitelist || []).map((h) => h.toLowerCase()));
    followersCache = b.handles
      .filter((h) => !white.has(h.toLowerCase()))
      .map((h) => {
        const d = (b.detail || {})[h.toLowerCase()] || {};
        const lk = h.toLowerCase();
        const apiSegs = (((st.apiSegments || {}).followers) || {})[lk] || [];
        const segs = apiSegs.slice();
        return {
          handle: h, name: d.name || '', verified: !!d.verified,
          isDefaultAvatar: !!d.isDefaultAvatar, bio: d.bio || '',
          tweets: d.tweets || 0, apiSegs, segs, sel: false
        };
      });
    return true;
  }

  function renderList() {
    renderChips('chipsF', SEGMENT_ORDER_FOLLOWING, followingCache, selectedSegF,
      (k) => { selectedSegF = k; renderList(); });
    const users = segUsersOf(followingCache, selectedSegF);
    const descEl = $('segDescF'); if (descEl) descEl.textContent = segDesc(selectedSegF);
    const ul = $('userList');
    ul.innerHTML = '';
    for (const u of users) {
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = !!u.sel; cb.dataset.handle = u.handle;
      cb.addEventListener('change', () => { u.sel = cb.checked; });
      const info = document.createElement('span');
      const badges = [];
      if (u.verified) badges.push('<span class="badge v">' + t('badgeVerified') + '</span>');
      if (isBot(u)) badges.push('<span class="badge bot">' + t('badgeBot') + '</span>');
      info.innerHTML = '<span class="handle">@' + esc(u.handle) + '</span> ' +
        '<span class="meta">' + esc(u.name || '') + '</span> ' + badges.join(' ');
      li.appendChild(cb); li.appendChild(info);
      ul.appendChild(li);
    }
    $('counts').textContent = t('segLine', segName(selectedSegF), users.length);
    applyImportedSelection('#userList', 'importStatus', 'following', followingCache);
  }

  /* Follower cleanup list (moved to top level in 1.5.8): this used
   * to be defined INSIDE the DOMContentLoaded callback, but the
   * top-level pollTask calls it in the apifetch-done branch —
   * outside that callback's scope the name did not exist, so the
   * call threw ReferenceError and the followers/cleanup list never
   * refreshed after a one-click analysis. Body unchanged. */
  function renderCleanupList() {
    renderChips('chipsC', SEGMENT_ORDER_FOLLOWERS, followersCache, selectedSegC,
      (k) => { selectedSegC = k; renderCleanupList(); });
    const users = segUsersOf(followersCache, selectedSegC);
    const descEl = $('segDescC'); if (descEl) descEl.textContent = segDesc(selectedSegC);
    const ul = $('cleanupList');
    ul.innerHTML = '';
    for (const u of users) {
      const li = document.createElement('li');
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = !!u.sel; cb.dataset.handle = u.handle;
      cb.addEventListener('change', () => { u.sel = cb.checked; });
      const info = document.createElement('span');
      const badges = [];
      if (u.verified) badges.push('<span class="badge v">' + t('badgeVerified') + '</span>');
      if (isBot(u)) badges.push('<span class="badge bot">' + t('badgeBot') + '</span>');
      info.innerHTML = '<span class="handle">@' + esc(u.handle) + '</span> ' +
        '<span class="meta">' + esc(u.name || '') + '</span> ' + badges.join(' ');
      li.appendChild(cb); li.appendChild(info);
      ul.appendChild(li);
    }
    $('countsC').textContent = t('segLine', segName(selectedSegC), users.length);
    applyImportedSelection('#cleanupList', 'importStatusC', 'followers', followersCache);
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---- imported target list (from the X Audience Analyzer site) ---- */

  function renderImportStatus() {
    const msg = importedList && (importedList.handles || []).length
      ? t('importLoaded', importedList.handles.length) : '';
    const a = $('importStatus'); if (a) a.textContent = msg;
    const b = $('importStatusC'); if (b) b.textContent = msg;
  }

  /* After a tab list renders: check exactly the imported handles (whitelist
     always wins) and uncheck the rest, then report the hit count. Never
     starts an action by itself — it only sets checkbox state. */
  async function applyImportedSelection(listSel, statusId, expectedKind, cache) {
    if (!importedList || !(importedList.handles || []).length) return;
    const st = await getS();
    const white = new Set((st.whitelist || []).map((h) => h.toLowerCase()));
    const want = new Set(importedList.handles);
    let hits = 0;
    if (Array.isArray(cache) && cache.length) {
      /* Selection lives on the underlying data: imported users get
       * checked even while a trait filter hides them from view, and
       * the visible checkboxes are then synced from the data. */
      for (const u of cache) {
        const match = want.has(String(u.handle || '').toLowerCase()) && !white.has(String(u.handle || '').toLowerCase());
        u.sel = match;
        if (match) hits++;
      }
      const byHandle = {};
      for (const u of cache) byHandle[String(u.handle || '').toLowerCase()] = u;
      document.querySelectorAll(listSel + ' input[type=checkbox]').forEach((cb) => {
        const u = byHandle[(cb.dataset.handle || '').toLowerCase()];
        if (u) cb.checked = u.sel !== false;
      });
    } else {
      const cbs = Array.from(document.querySelectorAll(listSel + ' input[type=checkbox]'));
      if (!cbs.length) return;
      for (const cb of cbs) {
        const h = (cb.dataset.handle || '').toLowerCase();
        const match = want.has(h) && !white.has(h);
        cb.checked = match;
        if (match) hits++;
      }
    }
    const warn = importedList.kind && importedList.kind !== expectedKind
      ? t('importKindMismatch') + ' ' : '';
    const el = $(statusId);
    if (el) el.textContent = warn + t('importHits', hits);
  }

  async function clearImportedList() {
    importedList = null;
    const s = await getS();
    delete s.importedList;
    await chrome.storage.local.set({ xum: s });
  }

  async function pollTask() {
    const s = await getS();
    const task = s.task;
    if (!task) return;
    if (task.type === 'scan') {
      setBar(task.done || 0, task.total || Math.max(task.done || 0, 1));
      if (task.status === 'running') setStatus(t('statusScanning', task.kind, task.done || 0));
      else if (task.status === 'done') setStatus(task.partial ? t('statusScanPartial', task.kind, task.done || 0) : t('statusScanDone', task.kind, task.done || 0));
    } else if (task.type === 'unfollow') {
      /* 1.5.9: bar, text and status all use processed = done+failed+skipped.
       * Before, the bar used done only, so any skipped/failed account made
       * the bar lag behind the "processed N / total" text (e.g. 4/4 text
       * with the bar stuck near half). */
      const procU = (task.done || 0) + (task.failed || 0) + (task.skipped || 0);
      setBar(procU, task.total || 1);
      const ptF = $('progTextF'); if (ptF) ptF.textContent = t('progressText', procU, task.total || 0);
      if (task.status === 'running') setStatus(t('statusUnfollowing', procU, task.total || 0));
      else if (task.status === 'resting') setStatus(t('unfollowResting', Math.max(1, Math.ceil(((task.restUntil || Date.now()) - Date.now()) / 1000))));
      else if (task.status === 'done') setStatus(t('statusUnfollowDone', task.done || 0) + (task.failed ? t('statusUnfollowFailed', task.failed) : '') + (task.skipped ? t('statusSkipped', task.skipped) : ''));
      else if (task.status === 'stopped') setStatus(t('statusStopped') + (task.failed ? t('statusUnfollowFailed', task.failed) : '') + (task.skipped ? t('statusSkipped', task.skipped) : ''));
      else if (task.status === 'capped') setStatus(t('statusCapped') + (task.skipped ? t('statusSkipped', task.skipped) : ''));
    } else if (task.type === 'cleanup') {
      setCleanupStatus(task);
      const procC = (task.done || 0) + (task.failed || 0) + (task.skipped || 0);
      const barC = $('barC'); if (barC) barC.style.width = (task.total ? Math.round((procC / task.total) * 100) : 0) + '%';
      const ptC = $('progTextC'); if (ptC) ptC.textContent = t('progressText', procC, task.total || 0);
    } else if (task.type === 'apifetch') {
      if (task.status === 'running') {
        const m = t('apiRunning', task.kind || 'following', task.done || 0, task.total || 0);
        setStatus(m);
        const a = $('apiStatus'); if (a) a.textContent = m;
        const c0 = $('cleanupStatus'); if (c0) { c0.textContent = m; c0.dataset.touched = '1'; }
        setBar(task.done || 0, task.total || Math.max(task.done || 0, 1));
      } else if (task.status === 'done') {
        const m = t('apiDoneMsg', task.followingCount || 0, task.followersCount || 0);
        const a = $('apiStatus'); if (a) a.textContent = m;
        const c1 = $('cleanupStatus'); if (c1) { c1.textContent = m; c1.dataset.touched = '1'; }
        if (lastApiTaskAt !== (task.finishedAt || 0)) {
          lastApiTaskAt = task.finishedAt || 0;
          setStatus(m);
          await buildFollowingCache();
          renderList();
          await buildFollowersCache();
          renderCleanupList();
        }
      } else if (task.status === 'error') {
        const m = t('apiFailed', task.error || '');
        setStatus(m);
        const a = $('apiStatus'); if (a) a.textContent = m;
      }
    }
  }

  function setCleanupStatus(task) {
    const el = $('cleanupStatus');
    el.dataset.touched = '1';
    if (!task) { el.textContent = t('cleanupStatusIdle'); return; }
    if (task.status === 'running') el.textContent = t('cleanupRunning', (task.done || 0) + (task.failed || 0) + (task.skipped || 0), task.total || 0);
    else if (task.status === 'resting') el.textContent = t('cleanupResting', Math.max(1, Math.ceil(((task.restUntil || Date.now()) - Date.now()) / 1000)));
    else if (task.status === 'done') el.textContent = t('cleanupDone', task.done || 0) + (task.failed ? t('cleanupFailed', task.failed) : '') + (task.skipped ? t('statusSkipped', task.skipped) : '');
    else if (task.status === 'stopped') el.textContent = t('statusStopped') + (task.failed ? t('cleanupFailed', task.failed) : '') + (task.skipped ? t('statusSkipped', task.skipped) : '');
    else if (task.status === 'capped') el.textContent = t('statusCapped') + (task.skipped ? t('statusSkipped', task.skipped) : '');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const s = await getS();
    lang = s.lang || 'zh';
    importedList = s.importedList || null;
    renderTexts();
    $('speedSel').value = s.speed || 'safe';
    $('capInput').value = s.dailyCap || 50;
    $('whiteArea').value = (s.whitelist || []).join('\n');
    $('whiteCount').textContent = t('whiteSaved', (s.whitelist || []).length);
    $('serverInput').value = s.licenseServer || '';
    await refreshProUI();
    if (s.followingList) { await buildFollowingCache(); renderList(); }
    if (s.followersList) { await buildFollowersCache(); renderCleanupList(); }

    // tabs
    document.querySelectorAll('.tabs button').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.tabs button').forEach((x) => x.classList.remove('active'));
        document.querySelectorAll('section.tab').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        $( 'tab-' + b.dataset.tab).classList.add('active');
      });
    });

    $('langZh').addEventListener('click', async () => { lang = 'zh'; await setS({ lang }); renderTexts(); renderList(); renderCleanupList(); });
    $('langEn').addEventListener('click', async () => { lang = 'en'; await setS({ lang }); renderTexts(); renderList(); renderCleanupList(); });

    $('scanFollowing').addEventListener('click', async () => {
      try { setStatus(t('statusScanning', 'following', 0)); await sendToX({ action: 'scan', kind: 'following', maxItems: 5000 }); }
      catch (e) { showErr(e); }
    });
    $('scanFollowers').addEventListener('click', async () => {
      try { setStatus(t('statusScanning', 'followers', 0)); await sendToX({ action: 'scan', kind: 'followers', maxItems: 5000 }); }
      catch (e) { showErr(e); }
    });
    $('resumeFollowing').addEventListener('click', async () => {
      try { setStatus(t('statusScanning', 'following', 0)); await sendToX({ action: 'scan', kind: 'following', maxItems: 5000, resume: true }); }
      catch (e) { showErr(e); }
    });
    $('resumeFollowers').addEventListener('click', async () => {
      try { setStatus(t('statusScanning', 'followers', 0)); await sendToX({ action: 'scan', kind: 'followers', maxItems: 5000, resume: true }); }
      catch (e) { showErr(e); }
    });

    /* One-click server analysis (Pro): the background worker pulls the
     * full following + followers lists from the analyzer API, so no
     * page scanning or file import is needed. */
    async function startApiFetch() {
      const lic = await XUMLicense.getLicense().catch(() => null);
      if (!lic || !lic.key) { setStatus(t('apiNeedPro')); return; }
      let handle = String(lic.boundHandle || '').replace(/^@/, '');
      try {
        const me = await sendToX({ action: 'whoami' });
        if (me && me.handle) handle = String(me.handle).replace(/^@/, '');
      } catch (e) { /* not on an X tab: fall back to the bound handle */ }
      if (!handle) { setStatus(t('apiNoHandle')); return; }
      setStatus(t('apiRunning', 'following', 0, 0));
      chrome.runtime.sendMessage({ action: 'apiFetch', handle }, (resp) => {
        void chrome.runtime.lastError;
        if (!resp || !resp.ok) setStatus(t('apiFailed', (resp && resp.reason) || 'unknown'));
      });
    }
    $('apiFetch').addEventListener('click', startApiFetch);
    $('apiFetchC').addEventListener('click', startApiFetch);

    $('computeNonFb').addEventListener('click', async () => {
      const st = await getS();
      if (!st.followingList || !st.followersList) { setStatus(t('needBoth')); return; }
      await buildFollowingCache();
      renderList();
    });

    $('selAll').addEventListener('click', () => { for (const u of segUsersOf(followingCache, selectedSegF)) u.sel = true; document.querySelectorAll('#userList input[type=checkbox]').forEach((c) => { c.checked = true; }); });
    $('selNone').addEventListener('click', () => { for (const u of segUsersOf(followingCache, selectedSegF)) u.sel = false; document.querySelectorAll('#userList input[type=checkbox]').forEach((c) => { c.checked = false; }); });

    $('startUnfollow').addEventListener('click', async () => {
      let targets = checkedTargets(followingCache);
      if (!targets.length) {
        const segUsers = segUsersOf(followingCache, selectedSegF);
        if (!segUsers.length) return;
        if (!window.confirm(t('confirmSegUnfollow', segUsers.length))) return;
        targets = segUsers.map((u) => u.handle);
      }
      const st = await getS();
      const pro = await XUMLicense.isPro().catch(() => false);
      const cap = pro ? (st.dailyCap || 50) : 20;
      try {
        /* 1.5.5: unfollow runs profile-by-profile in the content
         * script, so it can start from any X page — no need to steer
         * the tab to the Following list first (the 1.5.4 detour). */
        await sendToX({ action: 'unfollow', targets, speed: st.speed || 'safe', dailyCap: cap });
        if (!pro) setStatus(t('freeCapNote'));
      } catch (e) { showErr(e); }
    });
    $('stopBtn').addEventListener('click', async () => {
      try { await sendToX({ action: 'stop' }); } catch (e) { showErr(e); }
    });
    $('speedSel').addEventListener('change', async () => { await setS({ speed: $('speedSel').value }); });

    // ---- follower cleanup (Pro): remove followers via soft-block ----
    // renderCleanupList lives at top level since 1.5.8 (see there).

    $('computeNonBlue').addEventListener('click', async () => {
      if (!await XUMLicense.isPro().catch(() => false)) { setCleanupStatus({ status: 'idle' }); $('cleanupStatus').textContent = t('needPro'); $('cleanupStatus').dataset.touched = '1'; return; }
      const st = await getS();
      if (!st.followersList) { $('cleanupStatus').textContent = t('needScanFirst'); $('cleanupStatus').dataset.touched = '1'; return; }
      await buildFollowersCache();
      renderCleanupList();
    });

    $('selAllC').addEventListener('click', () => { for (const u of segUsersOf(followersCache, selectedSegC)) u.sel = true; document.querySelectorAll('#cleanupList input[type=checkbox]').forEach((c) => { c.checked = true; }); });
    $('selNoneC').addEventListener('click', () => { for (const u of segUsersOf(followersCache, selectedSegC)) u.sel = false; document.querySelectorAll('#cleanupList input[type=checkbox]').forEach((c) => { c.checked = false; }); });

    $('startCleanup').addEventListener('click', async () => {
      if (!await XUMLicense.isPro().catch(() => false)) { $('cleanupStatus').textContent = t('needPro'); $('cleanupStatus').dataset.touched = '1'; return; }
      let targets = checkedTargets(followersCache);
      if (!targets.length) {
        const segUsers = segUsersOf(followersCache, selectedSegC);
        if (!segUsers.length) return;
        if (!window.confirm(t('confirmSegCleanup', segUsers.length))) return;
        targets = segUsers.map((u) => u.handle);
      }
      const st = await getS();
      try {
        await sendToX({ action: 'cleanup', targets, speed: st.speed || 'safe', dailyCap: st.dailyCap || 50 });
      } catch (e) {
        if (e && e.message === 'not-pro') { $('cleanupStatus').textContent = t('needPro'); }
        else showErr(e);
        $('cleanupStatus').dataset.touched = '1';
      }
    });
    $('stopCleanupBtn').addEventListener('click', async () => {
      try { await sendToX({ action: 'stop' }); } catch (e) { showErr(e); }
    });

    // ---- imported target list: file pickers + clear buttons (both tabs) ----
    function wireImport(btnId, fileId, clearId, statusId, listSel, expectedKind) {
      $(btnId).addEventListener('click', () => $(fileId).click());
      $(fileId).addEventListener('change', async () => {
        const f = $(fileId).files && $(fileId).files[0];
        $(fileId).value = '';
        if (!f) return;
        let text = '';
        try { text = await f.text(); } catch (e) { $(statusId).textContent = t('importInvalid'); return; }
        const parsed = parseImportedListText(text);
        if (!parsed.ok) { $(statusId).textContent = t('importInvalid'); return; }
        importedList = {
          handles: parsed.handles,
          kind: parsed.kind || null,
          segment: parsed.segment || '',
          userName: parsed.userName || '',
          at: Date.now()
        };
        await setS({ importedList });
        renderImportStatus();
        // If this tab already shows a rendered list, select the matches now.
        applyImportedSelection(listSel, statusId, expectedKind,
          expectedKind === 'following' ? followingCache : followersCache);
      });
      $(clearId).addEventListener('click', async () => {
        await clearImportedList();
        renderImportStatus();
        $(statusId).textContent = t('importCleared');
      });
    }
    wireImport('importBtn', 'importFile', 'clearImport', 'importStatus', '#userList', 'following');
    wireImport('importBtnC', 'importFileC', 'clearImportC', 'importStatusC', '#cleanupList', 'followers');

    // ---- Pro subscription UI ----
    async function refreshProUI() {
      const lic = await XUMLicense.getLicense().catch(() => null);
      const pro = await XUMLicense.isPro().catch(() => false);
      if (pro && lic) {
        let html = esc(t('proActive', lic.exp));
        const bh = String(lic.boundHandle || '').replace(/^@/, '');
        if (bh) html += ' @' + esc(bh) + GOLD_BADGE_SVG;
        $('proStatus').innerHTML = html;
      } else {
        $('proStatus').textContent = t('proFree');
      }
      // free tier: no fast speed
      $('speedSel').options[0].disabled = !pro;
      if (!pro && $('speedSel').value === 'fast') $('speedSel').value = 'safe';
    }

    $('buyBtn').addEventListener('click', () => { window.open('https://license.xiaonezha.shop/buy', '_blank'); });
    $('activateBtn').addEventListener('click', async () => {
      const key = $('keyInput').value.trim();
      if (!key) return;
      const st = await getS();
      if (!st.licenseServer) { setStatus(t('needServer')); return; }
      $('activateBtn').disabled = true;
      $('bindError').style.display = 'none';
      try {
        /* Binding is best-effort: take the current X handle when an X
         * tab is open; with no X tab/handle, activation still proceeds
         * handle-less and the server applies its own handling. */
        let handle = null;
        try {
          const me = await sendToX({ action: 'whoami' });
          if (me && me.handle) handle = me.handle;
        } catch (e) { /* no X tab / content script — proceed without */ }
        if (!handle) $('bindHint').style.display = '';
        const r = await XUMLicense.activate(key, st.licenseServer, handle);
        if (r.ok) {
          setStatus(r.offline ? t('offlineOk') : t('activeOk'));
          $('keyInput').value = '';
        } else if (r.reason === 'handle-mismatch') {
          const msg = r.boundHandle ? t('bindMismatch', r.boundHandle) : t('bindMismatchGeneric');
          $('bindError').textContent = msg;
          $('bindError').style.display = '';
          setStatus(msg);
        } else {
          setStatus(t('activeFail', r.reason || 'unknown'));
        }
      } catch (e) { showErr(e); }
      $('activateBtn').disabled = false;
      await refreshProUI();
    });

    $('serverSave').addEventListener('click', async () => {
      await setS({ licenseServer: $('serverInput').value.trim() });
      setStatus(t('serverSaved'));
    });

    // whitelist
    $('whiteSave').addEventListener('click', async () => {
      const list = $('whiteArea').value.split('\n').map(normHandle).filter(Boolean);
      await setS({ whitelist: Array.from(new Set(list)) });
      $('whiteCount').textContent = t('whiteSaved', list.length);
    });

    // settings
    $('capSave').addEventListener('click', async () => {
      const v = Math.max(1, Math.min(500, parseInt($('capInput').value, 10) || 50));
      $('capInput').value = v;
      await setS({ dailyCap: v });
      setStatus(t('capSaved'));
    });

    setInterval(pollTask, 1200);
    pollTask();
  });

})();
