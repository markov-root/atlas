// src/theme/DocItem/Landing/ProjectStory.jsx
import React from 'react';
import styles from './ProjectStory.module.css';

export default function ProjectStory() {
  return (
    <div className={styles.storyContainer}>
      <div className={styles.storyContent}>
        
        {/* First Q&A: Why do you need to understand AI Safety? */}
        <div className={styles.questionSection}>
          <div className={styles.questionContent}>
            <div className={styles.questionSide}>
              <h2 className={styles.question}>
                Why do you need to understand AI Safety?
              </h2>
            </div>
            
            <div className={styles.answerSide}>
              <p className={styles.answerText}>
                We're living through the most consequential technological transition in human history. 
                AI systems are rapidly approaching human capabilities across domains that were unthinkable 
                just years ago. Some of the <a href="https://scholar.google.com/citations?hl=en&view_op=search_authors&mauthors=label%3Aartificial_intelligence+OR+label%3AAI&btnG=" target="_blank" rel="noopener noreferrer" className={styles.credibilityLink}>most cited AI researchers</a> are sounding urgent warnings about the path ahead.
              </p>
              
              {/* Expert Quotes - Clean minimal style */}
              <div className={styles.expertQuotes}>
                
                <div className={styles.expertQuote}>
                  <div className={styles.quoteContainer}>
                    <div className={styles.imageSection}>
                      <img 
                        src="/img/quotes/yoshua_bengio.jpg" 
                        alt="Yoshua Bengio" 
                        className={styles.expertImage}
                      />
                    </div>
                    <div className={styles.quoteContent}>
                      <blockquote className={styles.quote}>
                        "We have agency. It's not too late to steer the evolution of societies and humanity in a positive and beneficial direction. But for that, we need enough people who understand both the advantages and the risks, and we need enough people to work on the solutions. And the solutions can be technological, they could be political... policy, but we need enough effort in those directions right now."
                                  </blockquote>
                      <div className={styles.quoteFooter}>
                        <div className={styles.expertInfo}>
                          <div className={styles.expertName}>Yoshua Bengio</div>
                          <div className={styles.expertTitle}>Most cited computer scientist globally, Turing Award Winner, Scientific Director of Mila</div>
                        </div>
                        <div className={styles.quoteSource}>
                          <span className={styles.sourceDate}>2024</span>
                          <a href="https://www.cnbc.com/2024/11/21/will-ai-replace-humans-yoshua-bengio-warns-of-artificial-intelligence-risks.html" target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                            CNBC Interview
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.expertQuote}>
                  <div className={styles.quoteContainer}>
                    <div className={styles.imageSection}>
                      <img 
                        src="/img/quotes/geoffrey_hinton.jpg" 
                        alt="Geoffrey Hinton" 
                        className={styles.expertImage}
                      />
                    </div>
                    <div className={styles.quoteContent}>
                      <blockquote className={styles.quote}>
                        "We're dealing with things we've never dealt with before. And normally, the first time you deal with something totally novel, you get it wrong. And we can't afford to get it wrong."
                      </blockquote>
                      <div className={styles.quoteFooter}>
                        <div className={styles.expertInfo}>
                          <div className={styles.expertName}>Geoffrey Hinton</div>
                          <div className={styles.expertTitle}>Turing Award Winner 2018, "Godfather of AI"</div>
                        </div>
                        <div className={styles.quoteSource}>
                          <span className={styles.sourceDate}>2023</span>
                          <a href="https://www.cbsnews.com/news/geoffrey-hinton-ai-dangers-60-minutes-transcript/" target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                            CBS 60 Minutes Interview
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.expertQuote}>
                  <div className={styles.quoteContainer}>
                    <div className={styles.imageSection}>
                      <img 
                        src="/img/quotes/ilya_sutskever.jpg" 
                        alt="Ilya Sutskever" 
                        className={styles.expertImage}
                      />
                    </div>
                    <div className={styles.quoteContent}>
                      <blockquote className={styles.quote}>
                        "It's obviously important that any superintelligence anyone builds does not go rogue... It's an unsolved problem."
                      </blockquote>
                      <div className={styles.quoteFooter}>
                        <div className={styles.expertInfo}>
                          <div className={styles.expertName}>Ilya Sutskever</div>
                          <div className={styles.expertTitle}>Co-Founder and former Chief Scientist at OpenAI, Co-Founder Safe Superintelligence Inc.</div>
                        </div>
                        <div className={styles.quoteSource}>
                          <span className={styles.sourceDate}>2023</span>
                          <a href="https://www.technologyreview.com/2023/10/26/1082398/exclusive-ilya-sutskever-openais-chief-scientist-on-his-hopes-and-fears-for-the-future-of-ai/" target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                            MIT Technology Review
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
              
              <p className={styles.problemText}>
                Whether you work in policy, engineering, business, or are just a concerned citizen— the information you need is currently scattered across hundreds of research papers, blog posts, and technical discussions.
              </p>
              
              <p className={styles.solutionHighlight}>
                That's why we are creating the AI Safety Atlas.
              </p>
            </div>
          </div>
        </div>

        {/* Second Q&A: What is the AI Safety Atlas? */}
        <div className={styles.questionSection}>
          <div className={styles.questionContent}>
            <div className={styles.questionSide}>
              <h2 className={styles.question}>
                What is the AI Safety Atlas?
              </h2>
            </div>
            
            <div className={styles.answerSide}>
              <p className={styles.answerText}>
                We transform scattered AI safety knowledge into systematic explanations. The Atlas performs 
                the essential <strong>interpretive labor</strong>—creating clear, connected pathways through complex 
                research so new contributors can understand and advance safety work instead of spending 
                months piecing together the landscape. We've helped hundreds of students globally across multiple universities 
                build a foundational understanding of safety.
              </p>
              
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
