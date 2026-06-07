// nucorns — personal blog / profile page. Reads identity from signup (localStorage).
const { useState } = React;

function Nav() {
  return (
    <header className="nu-nav">
      <div className="nu-nav-inner">
        <a className="nu-wordmark" href="nucorns — Profile.html"><img className="nu-logo-img" src="assets/nucorns-mark-circle.png" alt="" />nu<span>corns</span></a>
        <div className="nu-search"><Icon name="search" size={18} /><input placeholder="Search creators & stories" /></div>
        <div className="nu-nav-right">
          <a className="nu-nav-write" href="nucorns — Write.html"><Icon name="sparkle" size={16} />Write</a>
          <Portrait grad={["#FFD27A", "#FF8A3D"]} name="You" size={36} />
        </div>
      </div>
    </header>
  );
}

function coverBg(cov) {
  if (cov && cov.src) return { background: `center/cover url(${cov.src})` };
  return { background: cov.length > 2
    ? `linear-gradient(120deg, ${cov[0]}, ${cov[1]} 55%, ${cov[2]})`
    : `linear-gradient(135deg, ${cov[0]}, ${cov[1]})` };
}

function PostCard({ post, featured }) {
  const inner = (
    <>
      <div className={"pc-cover" + (featured ? " pc-cover-feat" : "")}>
        <div className="nu-ph" style={coverBg(post.cover)}>
          {!(post.cover && post.cover.src) && <span className="nu-ph-stripes" />}
        </div>
        {post.pinned && <span className="pc-pin"><Icon name="bookmark" size={13} />Pinned</span>}
        {post.mine && <span className="pc-pin"><Icon name="sparkle" size={13} />Your story</span>}
      </div>
      <div className="pc-body">
        <div className="pc-cat">{post.category}</div>
        <h3 className="pc-title">{post.title}</h3>
        <p className="pc-dek">{post.dek}</p>
        <div className="pc-meta">
          <span>{post.date}</span><span className="nu-dot">·</span><span>{post.readTime} read</span>
          <span className="pc-stats">
            <span><Icon name="heart" size={14} />{nuFmt(post.hearts)}</span>
            <span><Icon name="reply" size={14} />{nuFmt(post.comments)}</span>
          </span>
        </div>
        {post.href && <span className="pc-open">Read & join the conversation <Icon name="chevron" size={15} /></span>}
        {post.mine && !post.href && <span className="pc-open" style={{ color: "var(--muted)" }}><Icon name="check" size={15} />Published</span>}
      </div>
    </>
  );
  const cls = "pc" + (featured ? " is-featured" : "") + (post.href ? " is-link" : "");
  return post.href
    ? <a className={cls} href={post.href}>{inner}</a>
    : <div className={cls} onClick={(e) => e.preventDefault()}>{inner}</div>;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [profile] = useState(() => nuLoadProfile());
  const [tab, setTab] = useState("posts");
  const [following, setFollowing] = useState(false);

  const userStories = nuLoadStories();
  const allStories = [...userStories, ...NU_POSTS];
  const featured = userStories[0] || NU_POSTS.find((p) => p.pinned) || NU_POSTS[0];
  const rest = allStories.filter((p) => p !== featured);
  const mediaCovers = allStories.map((p) => p.cover);

  const rootStyle = {
    "--accent": t.lead === "orange" ? "var(--orange)" : "var(--sky)",
    "--accent-2": t.lead === "orange" ? "var(--sky)" : "var(--orange)",
    "--radius": t.roundness + "px",
    "--font": t.font === "Sora" ? "'Sora', sans-serif" : t.font === "Hanken" ? "'Hanken Grotesque', sans-serif" : "'Plus Jakarta Sans', sans-serif",
  };

  return (
    <div className="nu-root" data-direction={t.direction} data-density={t.density} style={rootStyle}>
      <Nav />
      <main className="pf-main">
        {/* banner */}
        <div className="pf-banner" style={{ background: `linear-gradient(120deg, ${profile.bannerGrad[0]}, ${profile.bannerGrad[1]} 55%, ${profile.bannerGrad[2] || profile.bannerGrad[1]})` }}>
          <span className="nu-ph-stripes" />
        </div>

        {/* identity */}
        <section className="pf-head">
          <div className="pf-av"><Portrait grad={profile.avatarGrad} src={profile.avatarSrc} name={profile.name} size={120} ring /></div>
          <div className="pf-id">
            <div className="pf-id-row">
              <div>
                <h1 className="pf-name">{profile.name}</h1>
                <div className="pf-handle">@{profile.handle}{profile.location ? " · " + profile.location : ""} · {profile.joined}</div>
              </div>
              <div className="pf-actions">
                {profile.isYou
                  ? <a className="nu-follow is-following pf-edit" href="nucorns — Sign Up.html"><Icon name="sparkle" size={15} />Edit profile</a>
                  : <button className={"nu-follow" + (following ? " is-following" : "")} onClick={() => setFollowing((v) => !v)}>
                      {following ? <><Icon name="check" size={15} />Following</> : "Follow"}
                    </button>}
                <button className="nu-pill pf-share"><Icon name="share" size={17} />Share</button>
              </div>
            </div>
            <p className="pf-bio">{profile.bio}</p>
            <div className="pf-chips">
              {profile.interests.map((i) => <span key={i} className="pf-chip">{i}</span>)}
            </div>
            <div className="pf-stats">
              <span><strong>{allStories.length}</strong> stories</span>
              <span><strong>{nuFmt(profile.followers)}</strong> followers</span>
              <span><strong>{nuFmt(profile.following)}</strong> following</span>
            </div>
          </div>
        </section>

        {/* tabs */}
        <nav className="pf-tabs">
          {["posts", "media", "about"].map((id) => (
            <button key={id} className={"pf-tab" + (tab === id ? " is-on" : "")} onClick={() => setTab(id)}>
              {id === "posts" ? "Stories" : id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </nav>

        {tab === "posts" && (
          <section className="pf-feed">
            {profile.isYou && (
              <a className="pf-writecta" href="nucorns — Write.html">
                <span className="pf-writecta-ic"><Icon name="sparkle" size={18} /></span>
                <span className="pf-writecta-tx"><strong>Write a story</strong>Share something new with your readers</span>
                <Icon name="chevron" size={18} />
              </a>
            )}
            <PostCard post={featured} featured />
            <AdSlot slotId="feed" />
            <div className="pf-grid">
              {rest.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {tab === "media" && (
          <section className="pf-media">
            {mediaCovers.map((c, i) => (
              <div key={i} className="pf-media-tile"><div className="nu-ph" style={coverBg(c)}>{!(c && c.src) && <span className="nu-ph-stripes" />}</div></div>
            ))}
          </section>
        )}

        {tab === "about" && (
          <section className="pf-about">
            <h3>About</h3>
            <p>{profile.bio}</p>
            <h3>Interests</h3>
            <div className="pf-chips">{profile.interests.map((i) => <span key={i} className="pf-chip">{i}</span>)}</div>
            <h3>Details</h3>
            <ul className="pf-details">
              <li><span>Location</span><strong>{profile.location}</strong></li>
              <li><span>Member</span><strong>{profile.joined}</strong></li>
              <li><span>Handle</span><strong>@{profile.handle}</strong></li>
            </ul>
          </section>
        )}

        <MatchSection profile={profile} stories={profile.isYou ? userStories : NU_POSTS} />

        <footer className="nu-foot">made with <span className="nu-foot-mark">nucorns</span> · your corner of the internet ✦ · <a href="nucorns — Advertising.html">Advertise</a></footer>
      </main>

      <TweaksPanel>
        <TweakSection label="Direction" />
        <TweakRadio label="Style" value={t.direction} options={["playful", "minimal", "bold"]} onChange={(v) => setTweak("direction", v)} />
        <TweakSection label="Color" />
        <TweakRadio label="Lead accent" value={t.lead} options={["sky", "orange"]} onChange={(v) => setTweak("lead", v)} />
        <TweakSection label="Shape & type" />
        <TweakSlider label="Roundness" value={t.roundness} min={4} max={26} step={1} unit="px" onChange={(v) => setTweak("roundness", v)} />
        <TweakSelect label="Font" value={t.font} options={["Jakarta", "Sora", "Hanken"]} onChange={(v) => setTweak("font", v)} />
        <TweakRadio label="Density" value={t.density} options={["cozy", "comfy"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "playful",
  "lead": "sky",
  "roundness": 18,
  "font": "Jakarta",
  "density": "cozy"
}/*EDITMODE-END*/;

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
